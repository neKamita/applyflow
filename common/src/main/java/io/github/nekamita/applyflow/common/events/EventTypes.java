package io.github.nekamita.applyflow.common.events;

/**
 * Event types double as routing keys on the topic exchange.
 */
public final class EventTypes {

    public static final String APPLICATION_SUBMITTED = "application.submitted";
    public static final String PAYMENT_COMPLETED = "payment.completed";
    public static final String PAYMENT_FAILED = "payment.failed";

    /** Binding pattern that matches every payment outcome. */
    public static final String ALL_PAYMENT_EVENTS = "payment.*";

    private EventTypes() {
    }
}
