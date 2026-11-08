package io.github.nekamita.applyflow.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
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
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import io.github.nekamita.applyflow.common.events.ApplicationSubmitted;
import io.github.nekamita.applyflow.common.events.EventEnvelope;
import io.github.nekamita.applyflow.common.events.EventTypes;
import io.github.nekamita.applyflow.common.events.PaymentCompleted;
import io.github.nekamita.applyflow.common.events.PaymentFailed;
import io.github.nekamita.applyflow.common.messaging.EventCodec;
import io.github.nekamita.applyflow.common.messaging.Topology;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ApplicationServiceIntegrationTest {

    private static final String SUBMITTED_PROBE = "test.application-submitted";

    @Autowired MockMvc mockMvc;
    @Autowired JdbcClient jdbcClient;
    @Autowired RabbitTemplate rabbitTemplate;
    @Autowired AmqpAdmin amqpAdmin;
    @Autowired StringRedisTemplate redis;
    @Autowired EventCodec eventCodec;
    @Autowired JsonMapper jsonMapper;

    private String student;

    @BeforeEach
    void setUp() {
        student = "student-" + UUID.randomUUID();
        Queue probe = new Queue(SUBMITTED_PROBE, true, false, false);
        amqpAdmin.declareQueue(probe);
        amqpAdmin.declareBinding(BindingBuilder.bind(probe).to(Topology.eventsExchange()).with(EventTypes.APPLICATION_SUBMITTED));
        amqpAdmin.purgeQueue(SUBMITTED_PROBE, false);
    }

    @Test
    void submittingAnApplicationStoresItAndPublishesAnEventThroughTheOutbox() throws Exception {
        String id = submit("key-00000001", "bham-msc-cs", "tok_visa")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.applicationFee").value(80.00))
                .andReturn().getResponse().getContentAsString();
        UUID applicationId = UUID.fromString(jsonMapper.readTree(id).get("id").asString());

        EventEnvelope<ApplicationSubmitted> event = awaitSubmittedEvent(applicationId);
        assertThat(event.eventType()).isEqualTo(EventTypes.APPLICATION_SUBMITTED);
        assertThat(event.payload().applicationId()).isEqualTo(applicationId);
        assertThat(event.payload().applicantId()).isEqualTo(student);
        assertThat(event.payload().feeAmount()).isEqualByComparingTo("80.00");
        assertThat(event.payload().paymentToken()).isEqualTo("tok_visa");
        assertThat(event.correlationId()).isEqualTo("corr-test-1");

        await().atMost(Duration.ofSeconds(5)).until(() -> jdbcClient
                .sql("SELECT published_at IS NOT NULL FROM outbox_events WHERE id = :id")
                .param("id", event.eventId()).query(Boolean.class).single());
    }

    @Test
    void retryWithTheSameKeyReturnsTheOriginalApplicationInsteadOfCreatingASecondOne() throws Exception {
        String first = submit("key-00000002", "tum-msc-informatics", "tok_visa")
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        submit("key-00000002", "tum-msc-informatics", "tok_visa")
                .andExpect(status().isOk())
                .andExpect(header().string("Idempotent-Replayed", "true"))
                .andExpect(jsonPath("$.id").value(jsonMapper.readTree(first).get("id").asString()));

        assertThat(countApplications()).isEqualTo(1);
    }

    @Test
    void reusingAKeyWithADifferentBodyIsRejected() throws Exception {
        submit("key-00000003", "tum-msc-informatics", "tok_visa").andExpect(status().isCreated());

        submit("key-00000003", "kaist-msc-ai", "tok_visa").andExpect(status().isUnprocessableContent());

        assertThat(countApplications()).isEqualTo(1);
    }

    @Test
    void databaseConstraintStillPreventsDuplicatesWhenRedisLostTheKey() throws Exception {
        submit("key-00000004", "polimi-bsc-ce", "tok_visa").andExpect(status().isCreated());
        redis.delete(redis.keys("applyflow:idempotency:applications:" + student + ":*"));

        submit("key-00000004", "polimi-bsc-ce", "tok_visa")
                .andExpect(status().isOk())
                .andExpect(header().string("Idempotent-Replayed", "true"));

        assertThat(countApplications()).isEqualTo(1);
    }

    @Test
    void paymentEventsMoveTheApplicationToAFinalStatusExactlyOnce() throws Exception {
        UUID applicationId = submitAndGetId("key-00000005");

        EventEnvelope<PaymentCompleted> paid = envelope(EventTypes.PAYMENT_COMPLETED, applicationId,
                new PaymentCompleted(UUID.randomUUID(), applicationId, student, "s@example.com", new BigDecimal("80.00"), "GBP"));
        publish(paid);
        publish(paid); // redelivery of the same event

        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                mockMvc.perform(get("/api/applications/{id}", applicationId).header("X-User-Id", student))
                        .andExpect(jsonPath("$.status").value("PAID")));

        // A late failure must not overwrite a final status.
        EventEnvelope<PaymentFailed> lateFailure = envelope(EventTypes.PAYMENT_FAILED, applicationId,
                new PaymentFailed(applicationId, student, "s@example.com", "Card declined"));
        publish(lateFailure);

        await().atMost(Duration.ofSeconds(10)).until(() -> isProcessed(lateFailure.eventId()));
        assertThat(isProcessed(paid.eventId())).isTrue();
        mockMvc.perform(get("/api/applications/{id}", applicationId).header("X-User-Id", student))
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.failureReason").doesNotExist());
    }

    @Test
    void applicationsAreOnlyVisibleToTheirOwner() throws Exception {
        UUID applicationId = submitAndGetId("key-00000006");

        mockMvc.perform(get("/api/applications/{id}", applicationId).header("X-User-Id", "someone-else"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/applications/{id}", applicationId))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidRequestsAreRejected() throws Exception {
        submit("key-00000007", "no-such-program", "tok_visa").andExpect(status().isNotFound());
        submit("key-00000008", "bham-msc-cs", "4111111111111111").andExpect(status().isBadRequest());
        submit("short", "bham-msc-cs", "tok_visa").andExpect(status().isBadRequest());
    }

    @Test
    void programCatalogIsServedFromRedisAfterTheFirstRead() throws Exception {
        mockMvc.perform(get("/api/programs/kaist-msc-ai"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.university").value("KAIST"));

        String cached = redis.opsForValue().get("applyflow:program::kaist-msc-ai");
        assertThat(cached).contains("\"university\":\"KAIST\"");
    }

    private ResultActions submit(String idempotencyKey, String programId, String paymentToken) throws Exception {
        String body = """
                {"programId": "%s", "applicantEmail": "student@example.com", "paymentToken": "%s"}
                """.formatted(programId, paymentToken);
        return mockMvc.perform(post("/api/applications")
                .header("X-User-Id", student)
                .header("Idempotency-Key", idempotencyKey)
                .header("X-Correlation-Id", "corr-test-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private UUID submitAndGetId(String idempotencyKey) throws Exception {
        String response = submit(idempotencyKey, "bham-msc-cs", "tok_visa")
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(jsonMapper.readTree(response).get("id").asString());
    }

    /** Other tests also submit applications, so skip events that belong to them. */
    private EventEnvelope<ApplicationSubmitted> awaitSubmittedEvent(UUID applicationId) {
        return await().atMost(Duration.ofSeconds(10)).until(() -> {
            Message message = rabbitTemplate.receive(SUBMITTED_PROBE);
            return message == null ? null : eventCodec.decode(message, ApplicationSubmitted.class);
        }, event -> event != null && event.payload().applicationId().equals(applicationId));
    }

    private <T> EventEnvelope<T> envelope(String type, UUID applicationId, T payload) {
        return new EventEnvelope<>(UUID.randomUUID(), type, applicationId.toString(), Instant.now(), "corr-test-2", payload);
    }

    private void publish(EventEnvelope<?> event) {
        Message message = MessageBuilder.withBody(eventCodec.encode(event).getBytes(StandardCharsets.UTF_8))
                .setContentType(MessageProperties.CONTENT_TYPE_JSON)
                .setMessageId(event.eventId().toString())
                .build();
        rabbitTemplate.send(Topology.EVENTS_EXCHANGE, event.eventType(), message);
    }

    private long countApplications() {
        return jdbcClient.sql("SELECT count(*) FROM applications WHERE applicant_id = :id")
                .param("id", student).query(Long.class).single();
    }

    private boolean isProcessed(UUID eventId) {
        return jdbcClient.sql("SELECT count(*) FROM processed_messages WHERE event_id = :id")
                .param("id", eventId).query(Long.class).single() == 1;
    }
}
