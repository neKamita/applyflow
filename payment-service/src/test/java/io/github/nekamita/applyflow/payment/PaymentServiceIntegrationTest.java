package io.github.nekamita.applyflow.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;

import io.github.nekamita.applyflow.common.events.ApplicationSubmitted;
import io.github.nekamita.applyflow.common.events.EventEnvelope;
import io.github.nekamita.applyflow.common.events.EventTypes;
import io.github.nekamita.applyflow.common.events.PaymentCompleted;
import io.github.nekamita.applyflow.common.events.PaymentFailed;
import io.github.nekamita.applyflow.common.messaging.EventCodec;
import io.github.nekamita.applyflow.common.messaging.Topology;
import io.github.nekamita.applyflow.payment.messaging.ApplicationSubmittedListener;
import tools.jackson.databind.JsonNode;

@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.retry.initial-interval=50ms",
        "spring.rabbitmq.listener.simple.retry.max-interval=100ms"
})
@Import(TestcontainersConfiguration.class)
class PaymentServiceIntegrationTest {

    private static final String RESULTS_PROBE = "test.payment-results";
    private static final String DLQ = ApplicationSubmittedListener.QUEUE + Topology.DLQ_SUFFIX;

    @Autowired RabbitTemplate rabbitTemplate;
    @Autowired AmqpAdmin amqpAdmin;
    @Autowired JdbcClient jdbcClient;
    @Autowired EventCodec eventCodec;

    /** Results received from the probe queue that did not belong to the test that read them. */
    private final List<EventEnvelope<JsonNode>> received = new ArrayList<>();

    @BeforeEach
    void setUp() {
        Queue probe = new Queue(RESULTS_PROBE, true, false, false);
        amqpAdmin.declareQueue(probe);
        amqpAdmin.declareBinding(BindingBuilder.bind(probe).to(Topology.eventsExchange()).with(EventTypes.ALL_PAYMENT_EVENTS));
    }

    @Test
    void approvedChargeStoresThePaymentAndPublishesPaymentCompleted() {
        EventEnvelope<ApplicationSubmitted> submitted = submitted("tok_visa");
        publish(submitted);

        EventEnvelope<JsonNode> result = awaitResultFor(submitted.payload().applicationId());
        assertThat(result.eventType()).isEqualTo(EventTypes.PAYMENT_COMPLETED);
        assertThat(result.correlationId()).isEqualTo(submitted.correlationId());
        PaymentCompleted completed = eventCodec.payload(result, PaymentCompleted.class);
        assertThat(completed.amount()).isEqualByComparingTo("80.00");
        assertThat(completed.applicantEmail()).isEqualTo("student@example.com");
        assertThat(paymentStatus(submitted.payload().applicationId())).isEqualTo("COMPLETED");
    }

    @Test
    void redeliveredEventDoesNotChargeTwice() {
        EventEnvelope<ApplicationSubmitted> submitted = submitted("tok_visa");
        publish(submitted);
        publish(submitted);
        // A different event about the same application, e.g. a replayed outbox row with a new id.
        publish(new EventEnvelope<>(UUID.randomUUID(), submitted.eventType(), submitted.aggregateId(),
                submitted.occurredAt(), submitted.correlationId(), submitted.payload()));

        awaitResultFor(submitted.payload().applicationId());
        await().pollDelay(Duration.ofSeconds(1)).atMost(Duration.ofSeconds(3)).untilAsserted(() ->
                assertThat(outboxEventsFor(submitted.payload().applicationId())).isEqualTo(1));
        assertThat(paymentsFor(submitted.payload().applicationId())).isEqualTo(1);
    }

    @Test
    void declinedCardPublishesPaymentFailedWithoutRetrying() {
        EventEnvelope<ApplicationSubmitted> submitted = submitted("tok_declined");
        publish(submitted);

        EventEnvelope<JsonNode> result = awaitResultFor(submitted.payload().applicationId());
        assertThat(result.eventType()).isEqualTo(EventTypes.PAYMENT_FAILED);
        assertThat(eventCodec.payload(result, PaymentFailed.class).reason()).isEqualTo("Card declined by issuer");
        assertThat(paymentStatus(submitted.payload().applicationId())).isEqualTo("DECLINED");
    }

    @Test
    void providerOutageIsRetriedAndThenDeadLettered() {
        amqpAdmin.purgeQueue(DLQ, false);
        EventEnvelope<ApplicationSubmitted> submitted = submitted("tok_unavailable");
        publish(submitted);

        Message deadLetter = await().atMost(Duration.ofSeconds(15))
                .until(() -> rabbitTemplate.receive(DLQ), message -> message != null);
        assertThat(deadLetter.getMessageProperties().getMessageId()).isEqualTo(submitted.eventId().toString());
        assertThat(paymentsFor(submitted.payload().applicationId())).isZero();
        // Rolled back on every attempt, so a manual replay from the DLQ will be processed.
        assertThat(jdbcClient.sql("SELECT count(*) FROM processed_messages WHERE event_id = :id")
                .param("id", submitted.eventId()).query(Long.class).single()).isZero();
    }

    private EventEnvelope<ApplicationSubmitted> submitted(String paymentToken) {
        UUID applicationId = UUID.randomUUID();
        ApplicationSubmitted payload = new ApplicationSubmitted(applicationId, "student-1", "student@example.com",
                "bham-msc-cs", "MSc Computer Science", new BigDecimal("80.00"), "GBP", paymentToken);
        return new EventEnvelope<>(UUID.randomUUID(), EventTypes.APPLICATION_SUBMITTED, applicationId.toString(),
                Instant.now(), "corr-" + applicationId, payload);
    }

    private void publish(EventEnvelope<?> event) {
        Message message = MessageBuilder.withBody(eventCodec.encode(event).getBytes(StandardCharsets.UTF_8))
                .setContentType(MessageProperties.CONTENT_TYPE_JSON)
                .setMessageId(event.eventId().toString())
                .build();
        rabbitTemplate.send(Topology.EVENTS_EXCHANGE, event.eventType(), message);
    }

    private EventEnvelope<JsonNode> awaitResultFor(UUID applicationId) {
        return await().atMost(Duration.ofSeconds(10)).until(() -> {
            Message message = rabbitTemplate.receive(RESULTS_PROBE);
            if (message != null) {
                received.add(eventCodec.decodeRaw(message));
            }
            return received.stream().filter(e -> e.aggregateId().equals(applicationId.toString())).findFirst().orElse(null);
        }, event -> event != null);
    }

    private String paymentStatus(UUID applicationId) {
        return jdbcClient.sql("SELECT status FROM payments WHERE application_id = :id")
                .param("id", applicationId).query(String.class).single();
    }

    private long paymentsFor(UUID applicationId) {
        return jdbcClient.sql("SELECT count(*) FROM payments WHERE application_id = :id")
                .param("id", applicationId).query(Long.class).single();
    }

    private long outboxEventsFor(UUID applicationId) {
        return jdbcClient.sql("SELECT count(*) FROM outbox_events WHERE aggregate_id = :id")
                .param("id", applicationId.toString()).query(Long.class).single();
    }
}
