package io.github.nekamita.applyflow.common.events;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Published by application-service when a student submits an application.
 * Carries everything the downstream services need, so they never call application-service back.
 *
 * @param paymentToken token issued by the payment provider on the client side; never raw card data
 */
public record ApplicationSubmitted(
        UUID applicationId,
        String applicantId,
        String applicantEmail,
        String programId,
        String programName,
        BigDecimal feeAmount,
        String currency,
        String paymentToken) {
}
