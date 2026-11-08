package io.github.nekamita.applyflow.application.idempotency;

public class IdempotencyKeyReusedException extends RuntimeException {

    public IdempotencyKeyReusedException() {
        super("This Idempotency-Key was already used with a different request body");
    }
}
