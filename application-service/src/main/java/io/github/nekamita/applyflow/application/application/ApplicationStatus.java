package io.github.nekamita.applyflow.application.application;

/**
 * SUBMITTED -> PAID
 * SUBMITTED -> PAYMENT_FAILED
 * Both outcomes are final; a late or duplicate payment event cannot move an application back.
 */
public enum ApplicationStatus {
    SUBMITTED, PAID, PAYMENT_FAILED
}
