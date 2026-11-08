package io.github.nekamita.applyflow.gateway;

import java.util.UUID;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

/**
 * Adds identity and tracing headers to every proxied request.
 *
 * <p>A client-supplied {@code X-User-Id} is always removed first; otherwise anyone could act as any user
 * by sending the header themselves.
 */
@Component
class UserContextFilter implements GlobalFilter, Ordered {

    static final String USER_ID = "X-User-Id";
    static final String CORRELATION_ID = "X-Correlation-Id";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String incomingCorrelationId = exchange.getRequest().getHeaders().getFirst(CORRELATION_ID);
        String correlationId = isSafe(incomingCorrelationId) ? incomingCorrelationId : UUID.randomUUID().toString();
        exchange.getResponse().getHeaders().set(CORRELATION_ID, correlationId);

        return exchange.getPrincipal()
                .filter(JwtAuthenticationToken.class::isInstance)
                .map(principal -> ((JwtAuthenticationToken) principal).getToken().getSubject())
                .map(userId -> withHeaders(exchange, correlationId, userId))
                .defaultIfEmpty(withHeaders(exchange, correlationId, null))
                .flatMap(chain::filter);
    }

    private static ServerWebExchange withHeaders(ServerWebExchange exchange, String correlationId, String userId) {
        ServerHttpRequest request = exchange.getRequest().mutate()
                .headers(headers -> {
                    headers.remove(USER_ID);
                    headers.set(CORRELATION_ID, correlationId);
                    if (userId != null) {
                        headers.set(USER_ID, userId);
                    }
                })
                .build();
        return exchange.mutate().request(request).build();
    }

    private static boolean isSafe(String value) {
        return value != null && value.length() <= 64 && value.matches("[A-Za-z0-9._-]+");
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
