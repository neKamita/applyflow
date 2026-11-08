package io.github.nekamita.applyflow.application.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import io.github.nekamita.applyflow.application.application.ApplicationService;
import io.github.nekamita.applyflow.common.events.EventEnvelope;
import io.github.nekamita.applyflow.common.events.EventTypes;
import io.github.nekamita.applyflow.common.events.PaymentCompleted;
import io.github.nekamita.applyflow.common.events.PaymentFailed;
import io.github.nekamita.applyflow.common.messaging.EventCodec;
import io.github.nekamita.applyflow.common.messaging.Topology;
import io.github.nekamita.applyflow.common.outbox.InboxStore;
import io.github.nekamita.applyflow.common.web.CorrelationId;
import tools.jackson.databind.JsonNode;

/**
 * Second half of the choreography: applies the payment outcome to the application.
 */
@Component
public class PaymentResultListener {

    public static final String QUEUE = "application-service.payment-results";

    private static final Logger log = LoggerFactory.getLogger(PaymentResultListener.class);

    private final EventCodec eventCodec;
    private final InboxStore inboxStore;
    private final ApplicationService applicationService;

    public PaymentResultListener(EventCodec eventCodec, InboxStore inboxStore, ApplicationService applicationService) {
        this.eventCodec = eventCodec;
        this.inboxStore = inboxStore;
        this.applicationService = applicationService;
    }

    @RabbitListener(queues = QUEUE)
    @Transactional
    public void onMessage(Message message) {
        EventEnvelope<JsonNode> event = eventCodec.decodeRaw(message);
        try (MDC.MDCCloseable ignored = CorrelationId.bind(event.correlationId())) {
            if (!inboxStore.markProcessed(event.eventId(), QUEUE)) {
                log.info("Skipping duplicate event {}", event.eventId());
                return;
            }
            switch (event.eventType()) {
                case EventTypes.PAYMENT_COMPLETED ->
                        applicationService.onPaymentCompleted(eventCodec.payload(event, PaymentCompleted.class));
                case EventTypes.PAYMENT_FAILED ->
                        applicationService.onPaymentFailed(eventCodec.payload(event, PaymentFailed.class));
                default -> log.warn("Ignoring unknown event type {}", event.eventType());
            }
        }
    }

    @Configuration(proxyBeanMethods = false)
    static class QueueConfiguration {

        @Bean
        Declarables paymentResultsQueue() {
            return Topology.consumerQueue(QUEUE, EventTypes.ALL_PAYMENT_EVENTS);
        }
    }
}
