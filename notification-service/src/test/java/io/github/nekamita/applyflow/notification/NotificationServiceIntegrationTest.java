package io.github.nekamita.applyflow.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import io.github.nekamita.applyflow.common.events.ApplicationSubmitted;
import io.github.nekamita.applyflow.common.events.EventEnvelope;
import io.github.nekamita.applyflow.common.events.EventTypes;
import io.github.nekamita.applyflow.common.events.PaymentCompleted;
import io.github.nekamita.applyflow.common.messaging.EventCodec;
import io.github.nekamita.applyflow.common.messaging.Topology;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class NotificationServiceIntegrationTest {

    @Autowired RabbitTemplate rabbitTemplate;
    @Autowired EventCodec eventCodec;
    @Autowired NotificationStore store;
    @Autowired MockMvc mockMvc;

    @Test
    void eachEventProducesExactlyOneNotificationEvenWhenRedelivered() {
        UUID applicationId = UUID.randomUUID();
        EventEnvelope<ApplicationSubmitted> submitted = envelope(EventTypes.APPLICATION_SUBMITTED, applicationId,
                new ApplicationSubmitted(applicationId, "student-1", "aziz@example.com", "bham-msc-cs",
                        "MSc Computer Science", new BigDecimal("80.00"), "GBP", "tok_visa"));
        EventEnvelope<PaymentCompleted> paid = envelope(EventTypes.PAYMENT_COMPLETED, applicationId,
                new PaymentCompleted(UUID.randomUUID(), applicationId, "student-1", "aziz@example.com",
                        new BigDecimal("80.00"), "GBP"));

        publish(submitted);
        publish(submitted);
        publish(paid);

        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(store.forApplication(applicationId))
                        .extracting(Notification::subject)
                        .containsExactly("We received your application to MSc Computer Science", "Application fee paid"));
        // Give the duplicate time to arrive; it must still not be stored.
        await().pollDelay(Duration.ofMillis(500)).atMost(Duration.ofSeconds(2)).untilAsserted(() ->
                assertThat(store.forApplication(applicationId)).hasSize(2));
    }

    @Test
    void notificationsAreOnlyVisibleToTheApplicant() throws Exception {
        UUID applicationId = UUID.randomUUID();
        publish(envelope(EventTypes.APPLICATION_SUBMITTED, applicationId,
                new ApplicationSubmitted(applicationId, "student-2", "malika@example.com", "kaist-msc-ai",
                        "MSc Artificial Intelligence", new BigDecimal("60.00"), "USD", "tok_visa")));
        await().atMost(Duration.ofSeconds(10)).until(() -> !store.forApplication(applicationId).isEmpty());

        mockMvc.perform(get("/api/notifications/{id}", applicationId).header("X-User-Id", "student-2"))
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/notifications/{id}", applicationId).header("X-User-Id", "student-3"))
                .andExpect(jsonPath("$.length()").value(0));
    }

    private <T> EventEnvelope<T> envelope(String type, UUID applicationId, T payload) {
        return new EventEnvelope<>(UUID.randomUUID(), type, applicationId.toString(), Instant.now(), "corr-1", payload);
    }

    private void publish(EventEnvelope<?> event) {
        rabbitTemplate.send(Topology.EVENTS_EXCHANGE, event.eventType(),
                MessageBuilder.withBody(eventCodec.encode(event).getBytes(StandardCharsets.UTF_8))
                        .setContentType(MessageProperties.CONTENT_TYPE_JSON)
                        .setMessageId(event.eventId().toString())
                        .build());
    }
}
