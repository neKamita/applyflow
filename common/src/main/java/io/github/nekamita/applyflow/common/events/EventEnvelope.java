package io.github.nekamita.applyflow.common.events;

import java.time.Instant;
import java.util.UUID;

/**
 * Wire format of every event published to the bus.
 *
 * @param eventId       unique id, also used as the AMQP message id and as the deduplication key on the consumer side
 * @param eventType     routing key, see {@link EventTypes}
 * @param aggregateId   id of the entity the event is about; consumers use it for logging and lookups
 * @param occurredAt    time the state change was committed
 * @param correlationId id of the HTTP request that started the flow, propagated through every hop
 * @param payload       event-specific body
 */
public record EventEnvelope<T>(
        UUID eventId,
        String eventType,
        String aggregateId,
        Instant occurredAt,
        String correlationId,
        T payload) {
}
