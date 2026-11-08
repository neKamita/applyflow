package io.github.nekamita.applyflow.notification;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import tools.jackson.databind.json.JsonMapper;

/**
 * Keeps recent notifications per application in Redis. This service has no database: its state is
 * short-lived, and a lost notification history is acceptable, while a lost payment is not.
 */
@Component
public class NotificationStore {

    private final StringRedisTemplate redis;
    private final JsonMapper jsonMapper;
    private final Duration retention;

    public NotificationStore(StringRedisTemplate redis, JsonMapper jsonMapper,
                             @Value("${applyflow.notifications.retention:P7D}") Duration retention) {
        this.redis = redis;
        this.jsonMapper = jsonMapper;
        this.retention = retention;
    }

    /**
     * Claims an event for processing with {@code SET NX}. Returns {@code false} if another delivery of the
     * same event already claimed it, which makes the consumer idempotent without a database.
     */
    public boolean claim(UUID eventId) {
        return Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(processedKey(eventId), "1", retention));
    }

    /** Releases a claim after a failed send, so the retry is not mistaken for a duplicate. */
    public void release(UUID eventId) {
        redis.delete(processedKey(eventId));
    }

    public void append(Notification notification) {
        String key = listKey(notification.applicationId());
        redis.opsForList().rightPush(key, jsonMapper.writeValueAsString(notification));
        redis.expire(key, retention);
    }

    public List<Notification> forApplication(UUID applicationId) {
        List<String> values = redis.opsForList().range(listKey(applicationId), 0, -1);
        return values == null ? List.of() : values.stream()
                .map(value -> jsonMapper.readValue(value, Notification.class))
                .toList();
    }

    private static String processedKey(UUID eventId) {
        return "applyflow:notifications:processed:" + eventId;
    }

    private static String listKey(UUID applicationId) {
        return "applyflow:notifications:application:" + applicationId;
    }
}
