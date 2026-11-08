package io.github.nekamita.applyflow.application.idempotency;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import io.github.nekamita.applyflow.application.application.ApplicationService;
import io.github.nekamita.applyflow.application.application.ApplicationView;
import io.github.nekamita.applyflow.application.application.SubmitApplicationRequest;

/**
 * Makes {@code POST /api/applications} safe to retry. A student on a bad connection who presses "Submit"
 * twice, or a client that retries after a timeout, must not pay the application fee twice.
 *
 * <p>Flow for one {@code (applicant, Idempotency-Key)} pair:
 * <ol>
 *   <li>{@code SET NX} a {@code PENDING} marker in Redis. Only one concurrent request wins.</li>
 *   <li>The winner creates the application and stores {@code DONE} with the application id.</li>
 *   <li>A later request with the same key and body gets the stored application back (replay).
 *       While the first request is still running, the second gets 409.
 *       The same key with a different body is a client bug and gets 422.</li>
 * </ol>
 * Redis is the fast path. The unique constraint on {@code (applicant_id, idempotency_key)} is the
 * source of truth: it still prevents duplicates if Redis is flushed or unreachable.
 */
@Component
public class IdempotentSubmission {

    private static final Logger log = LoggerFactory.getLogger(IdempotentSubmission.class);
    private static final String PENDING = "PENDING";
    private static final String DONE = "DONE";

    private final StringRedisTemplate redis;
    private final ApplicationService applicationService;
    private final Duration ttl;

    public IdempotentSubmission(StringRedisTemplate redis, ApplicationService applicationService,
                                @Value("${applyflow.idempotency.ttl:PT24H}") Duration ttl) {
        this.redis = redis;
        this.applicationService = applicationService;
        this.ttl = ttl;
    }

    public Result submit(String applicantId, String idempotencyKey, SubmitApplicationRequest request) {
        String key = "applyflow:idempotency:applications:" + applicantId + ":" + idempotencyKey;
        String fingerprint = fingerprint(request);

        Optional<Boolean> acquired = tryAcquire(key, fingerprint);
        if (acquired.isPresent() && !acquired.get()) {
            return replayFromRedis(key, fingerprint, applicantId, idempotencyKey);
        }

        try {
            ApplicationView created = applicationService.submit(applicantId, idempotencyKey, request);
            store(key, DONE + ":" + fingerprint + ":" + created.id());
            return new Result(created, false);
        } catch (DataIntegrityViolationException e) {
            // Redis did not know the key (flushed or down), but the database did.
            ApplicationView existing = applicationService.findByIdempotencyKey(applicantId, idempotencyKey)
                    .orElseThrow(() -> e);
            store(key, DONE + ":" + fingerprint + ":" + existing.id());
            return new Result(existing, true);
        } catch (RuntimeException e) {
            // Let the client retry with the same key after a failure.
            release(key);
            throw e;
        }
    }

    private Result replayFromRedis(String key, String fingerprint, String applicantId, String idempotencyKey) {
        String stored = redis.opsForValue().get(key);
        if (stored == null) {
            // The marker expired between the two calls; fall back to the database.
            return applicationService.findByIdempotencyKey(applicantId, idempotencyKey)
                    .map(view -> new Result(view, true))
                    .orElseThrow(IdempotencyConflictException::new);
        }
        String[] parts = stored.split(":", 3);
        if (!parts[1].equals(fingerprint)) {
            throw new IdempotencyKeyReusedException();
        }
        if (PENDING.equals(parts[0])) {
            throw new IdempotencyConflictException();
        }
        UUID applicationId = UUID.fromString(parts[2]);
        return new Result(applicationService.get(applicationId, applicantId), true);
    }

    /** @return empty if Redis is unavailable; the database constraint then guards against duplicates */
    private Optional<Boolean> tryAcquire(String key, String fingerprint) {
        try {
            return Optional.ofNullable(redis.opsForValue().setIfAbsent(key, PENDING + ":" + fingerprint, ttl));
        } catch (RedisConnectionFailureException e) {
            log.warn("Redis unavailable, relying on the database for idempotency: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private void store(String key, String value) {
        try {
            redis.opsForValue().set(key, value, ttl);
        } catch (RedisConnectionFailureException e) {
            log.warn("Could not store idempotency result: {}", e.getMessage());
        }
    }

    private void release(String key) {
        try {
            redis.delete(key);
        } catch (RedisConnectionFailureException e) {
            log.warn("Could not release idempotency key: {}", e.getMessage());
        }
    }

    static String fingerprint(SubmitApplicationRequest request) {
        String canonical = String.join("\n", request.programId(), request.applicantEmail(), request.paymentToken());
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is always available", e);
        }
    }

    public record Result(ApplicationView application, boolean replayed) {
    }
}
