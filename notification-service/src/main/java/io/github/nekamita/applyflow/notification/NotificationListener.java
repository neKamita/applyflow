package io.github.nekamita.applyflow.notification;

import java.time.Clock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import io.github.nekamita.applyflow.common.events.ApplicationSubmitted;
import io.github.nekamita.applyflow.common.events.EventEnvelope;
import io.github.nekamita.applyflow.common.events.EventTypes;
import io.github.nekamita.applyflow.common.events.PaymentCompleted;
import io.github.nekamita.applyflow.common.events.PaymentFailed;
import io.github.nekamita.applyflow.common.messaging.EventCodec;
import io.github.nekamita.applyflow.common.messaging.Topology;
import io.github.nekamita.applyflow.common.web.CorrelationId;
import tools.jackson.databind.JsonNode;

@Component
public class NotificationListener {

    public static final String QUEUE = "notification-service.events";

    private static final Logger log = LoggerFactory.getLogger(NotificationListener.class);

    private final EventCodec eventCodec;
    private final NotificationStore store;
    private final NotificationSender sender;
    private final Clock clock;

    public NotificationListener(EventCodec eventCodec, NotificationStore store, NotificationSender sender, Clock clock) {
        this.eventCodec = eventCodec;
        this.store = store;
        this.sender = sender;
        this.clock = clock;
    }

    @RabbitListener(queues = QUEUE)
    public void onMessage(Message message) {
        EventEnvelope<JsonNode> event = eventCodec.decodeRaw(message);
        try (MDC.MDCCloseable ignored = CorrelationId.bind(event.correlationId())) {
            Notification notification = toNotification(event);
            if (notification == null) {
                log.warn("Ignoring unknown event type {}", event.eventType());
                return;
            }
            if (!store.claim(event.eventId())) {
                log.info("Skipping duplicate event {}", event.eventId());
                return;
            }
            try {
                sender.send(notification);
                store.append(notification);
            } catch (RuntimeException e) {
                store.release(event.eventId());
                throw e;
            }
        }
    }

    private Notification toNotification(EventEnvelope<JsonNode> event) {
        return switch (event.eventType()) {
            case EventTypes.APPLICATION_SUBMITTED -> {
                ApplicationSubmitted e = eventCodec.payload(event, ApplicationSubmitted.class);
                yield new Notification(event.eventId(), e.applicationId(), e.applicantId(), e.applicantEmail(),
                        "We received your application to " + e.programName(),
                        "Your application is being processed. We are charging the application fee of "
                                + e.feeAmount() + " " + e.currency() + ".",
                        clock.instant());
            }
            case EventTypes.PAYMENT_COMPLETED -> {
                PaymentCompleted e = eventCodec.payload(event, PaymentCompleted.class);
                yield new Notification(event.eventId(), e.applicationId(), e.applicantId(), e.applicantEmail(),
                        "Application fee paid",
                        "We received " + e.amount() + " " + e.currency() + ". Your application is now with the university.",
                        clock.instant());
            }
            case EventTypes.PAYMENT_FAILED -> {
                PaymentFailed e = eventCodec.payload(event, PaymentFailed.class);
                yield new Notification(event.eventId(), e.applicationId(), e.applicantId(), e.applicantEmail(),
                        "Payment failed",
                        "We could not charge the application fee: " + e.reason() + ". Please submit again with another card.",
                        clock.instant());
            }
            default -> null;
        };
    }

    @Configuration(proxyBeanMethods = false)
    static class QueueConfiguration {

        @Bean
        Declarables notificationQueue() {
            return Topology.consumerQueue(QUEUE, EventTypes.APPLICATION_SUBMITTED, EventTypes.ALL_PAYMENT_EVENTS);
        }
    }
}
