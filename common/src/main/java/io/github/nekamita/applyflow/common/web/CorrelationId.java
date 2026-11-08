package io.github.nekamita.applyflow.common.web;

import java.util.UUID;

import org.slf4j.MDC;

/**
 * One correlation id follows a request through the gateway, every service and every event it causes,
 * so a single grep over the logs shows the whole flow.
 */
public final class CorrelationId {

    public static final String HEADER = "X-Correlation-Id";
    public static final String MDC_KEY = "correlationId";

    private CorrelationId() {
    }

    public static String current() {
        return MDC.get(MDC_KEY);
    }

    /** Binds the id to the current thread; use with try-with-resources. */
    public static MDC.MDCCloseable bind(String correlationId) {
        String value = isValid(correlationId) ? correlationId : UUID.randomUUID().toString();
        return MDC.putCloseable(MDC_KEY, value);
    }

    /** Accepts only short, log-safe values so a client cannot inject arbitrary text into the logs. */
    static boolean isValid(String value) {
        return value != null && !value.isBlank() && value.length() <= 64 && value.matches("[A-Za-z0-9._-]+");
    }
}
