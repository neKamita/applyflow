package io.github.nekamita.applyflow.payment.messaging;

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
import io.github.nekamita.applyflow.common.messaging.EventCodec;
import io.github.nekamita.applyflow.common.messaging.Topology;
import io.github.nekamita.applyflow.common.web.CorrelationId;
import io.github.nekamita.applyflow.payment.PaymentProcessor;

@Component
public class ApplicationSubmittedListener {

    public static final String QUEUE = "payment-service.application-submitted";

    private final EventCodec eventCodec;
    private final PaymentProcessor paymentProcessor;

    public ApplicationSubmittedListener(EventCodec eventCodec, PaymentProcessor paymentProcessor) {
        this.eventCodec = eventCodec;
        this.paymentProcessor = paymentProcessor;
    }

    @RabbitListener(queues = QUEUE)
    public void onMessage(Message message) {
        EventEnvelope<ApplicationSubmitted> event = eventCodec.decode(message, ApplicationSubmitted.class);
        try (MDC.MDCCloseable ignored = CorrelationId.bind(event.correlationId())) {
            paymentProcessor.process(event);
        }
    }

    @Configuration(proxyBeanMethods = false)
    static class QueueConfiguration {

        @Bean
        Declarables applicationSubmittedQueue() {
            return Topology.consumerQueue(QUEUE, EventTypes.APPLICATION_SUBMITTED);
        }
    }
}
