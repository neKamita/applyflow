package io.github.nekamita.applyflow.common.messaging;

import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.core.Message;

import io.github.nekamita.applyflow.common.events.EventEnvelope;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Serializes and deserializes {@link EventEnvelope}s. A message that cannot be parsed is rejected without
 * requeue, so it goes straight to the dead-letter queue instead of blocking the consumer.
 */
public class EventCodec {

    private final JsonMapper jsonMapper;

    public EventCodec(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    public String encode(EventEnvelope<?> envelope) {
        return jsonMapper.writeValueAsString(envelope);
    }

    public <T> EventEnvelope<T> decode(Message message, Class<T> payloadType) {
        JavaType type = jsonMapper.getTypeFactory().constructParametricType(EventEnvelope.class, payloadType);
        try {
            return jsonMapper.readValue(message.getBody(), type);
        } catch (JacksonException e) {
            throw new AmqpRejectAndDontRequeueException("Malformed event " + message.getMessageProperties().getMessageId(), e);
        }
    }

    /** Decodes only the envelope; use {@link #payload} once the event type is known. */
    public EventEnvelope<JsonNode> decodeRaw(Message message) {
        return decode(message, JsonNode.class);
    }

    public <T> T payload(EventEnvelope<JsonNode> envelope, Class<T> payloadType) {
        try {
            return jsonMapper.treeToValue(envelope.payload(), payloadType);
        } catch (JacksonException e) {
            throw new AmqpRejectAndDontRequeueException("Malformed payload in event " + envelope.eventId(), e);
        }
    }
}
