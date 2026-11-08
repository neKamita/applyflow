package io.github.nekamita.applyflow.application.web;

public final class Headers {

    /** Subject of the validated JWT, set by the gateway. */
    public static final String USER_ID = "X-User-Id";
    public static final String IDEMPOTENCY_KEY = "Idempotency-Key";
    public static final String IDEMPOTENT_REPLAYED = "Idempotent-Replayed";

    private Headers() {
    }
}
