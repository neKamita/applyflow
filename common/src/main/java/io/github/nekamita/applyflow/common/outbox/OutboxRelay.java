package io.github.nekamita.applyflow.common.outbox;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.support.TransactionTemplate;

import io.github.nekamita.applyflow.common.messaging.Topology;

/**
 * Polls the outbox table and publishes pending events with publisher confirms.
 *
 * <p>Delivery is at-least-once: if the process dies after RabbitMQ confirmed a batch but before the
 * {@code published_at} update commits, the batch is sent again. Consumers deduplicate by event id
 * (see {@link InboxStore}).
 *
 * <p>{@code FOR UPDATE SKIP LOCKED} lets several replicas of a service run the relay at the same time:
 * each replica locks a different batch, and no row is published by two replicas concurrently.
 */
public class OutboxRelay {

    private static final Logger log = LoggerFactory.getLogger(OutboxRelay.class);

    private final JdbcClient jdbcClient;
    private final RabbitTemplate rabbitTemplate;
    private final TransactionTemplate transactionTemplate;
    private final int batchSize;
    private final long confirmTimeoutMs;
    private final int retentionDays;

    public OutboxRelay(JdbcClient jdbcClient, RabbitTemplate rabbitTemplate, TransactionTemplate transactionTemplate,
                       int batchSize, long confirmTimeoutMs, int retentionDays) {
        this.jdbcClient = jdbcClient;
        this.rabbitTemplate = rabbitTemplate;
        this.transactionTemplate = transactionTemplate;
        this.batchSize = batchSize;
        this.confirmTimeoutMs = confirmTimeoutMs;
        this.retentionDays = retentionDays;
    }

    @Scheduled(fixedDelayString = "${applyflow.outbox.poll-interval-ms:500}")
    public void publishPending() {
        try {
            Integer published = transactionTemplate.execute(status -> publishBatch());
            if (published != null && published > 0) {
                log.debug("Published {} outbox events", published);
            }
        } catch (RuntimeException e) {
            // The batch stays unpublished and is retried on the next tick.
            log.warn("Outbox relay failed, will retry: {}", e.getMessage());
        }
    }

    /** Publishes one batch inside the caller's transaction and returns how many events were sent. */
    int publishBatch() {
        List<OutboxRecord> batch = jdbcClient.sql("""
                        SELECT id, event_type, payload::text AS payload, correlation_id
                        FROM outbox_events
                        WHERE published_at IS NULL
                        ORDER BY created_at
                        LIMIT :limit
                        FOR UPDATE SKIP LOCKED
                        """)
                .param("limit", batchSize)
                .query(OutboxRecord.class)
                .list();
        if (batch.isEmpty()) {
            return 0;
        }

        rabbitTemplate.invoke(operations -> {
            for (OutboxRecord event : batch) {
                operations.send(Topology.EVENTS_EXCHANGE, event.eventType(), toMessage(event));
            }
            operations.waitForConfirmsOrDie(confirmTimeoutMs);
            return null;
        });

        jdbcClient.sql("UPDATE outbox_events SET published_at = now() WHERE id IN (:ids)")
                .param("ids", batch.stream().map(OutboxRecord::id).toList())
                .update();
        return batch.size();
    }

    /** Published rows are only kept for troubleshooting; delete them once they are older than the retention. */
    @Scheduled(fixedDelayString = "${applyflow.outbox.purge-interval-ms:3600000}")
    public void purgePublished() {
        int deleted = jdbcClient.sql("""
                        DELETE FROM outbox_events
                        WHERE published_at < now() - make_interval(days => :days)
                        """)
                .param("days", retentionDays)
                .update();
        if (deleted > 0) {
            log.info("Purged {} published outbox events", deleted);
        }
    }

    private static Message toMessage(OutboxRecord event) {
        return MessageBuilder.withBody(event.payload().getBytes(StandardCharsets.UTF_8))
                .setContentType(MessageProperties.CONTENT_TYPE_JSON)
                .setContentEncoding(StandardCharsets.UTF_8.name())
                .setMessageId(event.id().toString())
                .setCorrelationId(event.correlationId())
                .setType(event.eventType())
                .setDeliveryMode(MessageDeliveryMode.PERSISTENT)
                .build();
    }

    record OutboxRecord(UUID id, String eventType, String payload, String correlationId) {
    }
}
