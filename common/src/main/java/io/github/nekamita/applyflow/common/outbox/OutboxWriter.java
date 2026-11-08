package io.github.nekamita.applyflow.common.outbox;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import io.github.nekamita.applyflow.common.events.EventEnvelope;
import io.github.nekamita.applyflow.common.messaging.EventCodec;
import io.github.nekamita.applyflow.common.web.CorrelationId;

/**
 * Stores an event in the same database transaction as the business change.
 *
 * <p>Publishing to RabbitMQ directly from a transaction has two failure modes: the commit fails after the
 * message was sent (a ghost event), or the send fails after the commit (a lost event). Writing the event
 * to a table in the same transaction makes the change and the event atomic; {@link OutboxRelay}
 * delivers it afterwards.
 */
public class OutboxWriter {

    private final JdbcClient jdbcClient;
    private final EventCodec eventCodec;
    private final Clock clock;

    public OutboxWriter(JdbcClient jdbcClient, EventCodec eventCodec, Clock clock) {
        this.jdbcClient = jdbcClient;
        this.eventCodec = eventCodec;
        this.clock = clock;
    }

    /** Must join an existing transaction; without one the event and the business change are not atomic. */
    @Transactional(propagation = Propagation.MANDATORY)
    public <T> EventEnvelope<T> append(String eventType, String aggregateId, T payload) {
        Instant now = clock.instant();
        EventEnvelope<T> envelope = new EventEnvelope<>(
                UUID.randomUUID(), eventType, aggregateId, now, CorrelationId.current(), payload);

        jdbcClient.sql("""
                        INSERT INTO outbox_events (id, event_type, aggregate_id, payload, correlation_id, created_at)
                        VALUES (:id, :eventType, :aggregateId, CAST(:payload AS jsonb), :correlationId, :createdAt)
                        """)
                .param("id", envelope.eventId())
                .param("eventType", eventType)
                .param("aggregateId", aggregateId)
                .param("payload", eventCodec.encode(envelope))
                .param("correlationId", envelope.correlationId())
                .param("createdAt", Timestamp.from(now))
                .update();
        return envelope;
    }
}
