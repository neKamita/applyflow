package io.github.nekamita.applyflow.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import com.sun.net.httpserver.HttpServer;

/**
 * Runs the gateway against a tiny in-process HTTP server standing in for the downstream services,
 * and records the headers the gateway forwards.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, properties = {
        "applyflow.auth.jwt-secret=test-secret-that-is-at-least-32-bytes-long"
})
class GatewayIntegrationTest {

    private static final HttpServer downstream = startDownstream();
    private static final Map<String, String> forwardedHeaders = new ConcurrentHashMap<>();

    @Value("${local.server.port}")
    int port;

    private WebTestClient client;

    @DynamicPropertySource
    static void routes(DynamicPropertyRegistry registry) {
        String url = "http://localhost:" + downstream.getAddress().getPort();
        registry.add("APPLICATION_SERVICE_URL", () -> url);
        registry.add("PAYMENT_SERVICE_URL", () -> url);
        registry.add("NOTIFICATION_SERVICE_URL", () -> url);
    }

    @BeforeEach
    void setUp() {
        client = WebTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
        forwardedHeaders.clear();
    }

    @AfterAll
    static void stopDownstream() {
        downstream.stop(0);
    }

    @Test
    void validCredentialsReturnABearerToken() {
        client.post().uri("/auth/token")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("username", "aziz", "password", "aziz-demo-pass"))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.tokenType").isEqualTo("Bearer")
                .jsonPath("$.accessToken").isNotEmpty();
    }

    @Test
    void wrongPasswordIsRejected() {
        client.post().uri("/auth/token")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("username", "aziz", "password", "wrong"))
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void protectedRoutesRequireAToken() {
        client.get().uri("/api/applications").exchange().expectStatus().isUnauthorized();
        client.get().uri("/api/applications")
                .header("Authorization", "Bearer not-a-jwt")
                .exchange().expectStatus().isUnauthorized();
        assertThat(forwardedHeaders).isEmpty();
    }

    @Test
    void catalogIsPublic() {
        client.get().uri("/api/programs").exchange().expectStatus().isOk();
        assertThat(forwardedHeaders).doesNotContainKey("x-user-id");
    }

    @Test
    void forwardsTheTokenSubjectAndDropsASpoofedUserHeader() {
        client.get().uri("/api/applications")
                .header("Authorization", "Bearer " + login("malika", "malika-demo-pass"))
                .header("X-User-Id", "aziz")
                .header("X-Correlation-Id", "trace-123")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueEquals("X-Correlation-Id", "trace-123");

        assertThat(forwardedHeaders).containsEntry("x-user-id", "malika");
        assertThat(forwardedHeaders).containsEntry("x-correlation-id", "trace-123");
    }

    @Test
    void generatesACorrelationIdWhenTheClientSendsAnUnsafeOne() {
        client.get().uri("/api/programs")
                .header("X-Correlation-Id", "<script>alert(1)</script> " + "x".repeat(80))
                .exchange()
                .expectStatus().isOk();

        assertThat(forwardedHeaders.get("x-correlation-id")).matches("[0-9a-f-]{36}");
    }

    private String login(String username, String password) {
        return client.post().uri("/auth/token")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("username", username, "password", password))
                .exchange()
                .expectStatus().isOk()
                .expectBody(Map.class)
                .returnResult()
                .getResponseBody()
                .get("accessToken")
                .toString();
    }

    private static HttpServer startDownstream() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
            server.createContext("/", exchange -> {
                exchange.getRequestHeaders().forEach((name, values) ->
                        forwardedHeaders.put(name.toLowerCase(), values.getFirst()));
                byte[] body = "[]".getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, body.length);
                exchange.getResponseBody().write(body);
                exchange.close();
            });
            server.start();
            return server;
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }
}
