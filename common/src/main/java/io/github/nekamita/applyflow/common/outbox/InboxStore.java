package io.github.nekamita.applyflow.common.outbox;

import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Idempotent consumer. RabbitMQ and the outbox both deliver at least once, so the same event can arrive
 * twice. Recording the event id in the same transaction as its side effects means a duplicate is detected
 * and skipped, and a rolled-back attempt leaves no record, so the retry is processed normally.
 */
public class InboxStore {

    private final JdbcClient jdbcClient;

    public InboxStore(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    /**
     * Records the event as processed by the given consumer.
     *
     * @return {@code true} the first time, {@code false} if the event was already processed
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean markProcessed(UUID eventId, String consumer) {
        int inserted = jdbcClient.sql("""
                        INSERT INTO processed_messages (event_id, consumer, processed_at)
                        VALUES (:eventId, :consumer, now())
                        ON CONFLICT DO NOTHING
                        """)
                .param("eventId", eventId)
                .param("consumer", consumer)
                .update();
        return inserted == 1;
    }
}
