package io.github.nekamita.applyflow.common.events;

import java.util.UUID;

/**
 * A business-level decline (for example insufficient funds). Infrastructure failures are retried
 * and never produce this event.
 */
public record PaymentFailed(
        UUID applicationId,
        String applicantId,
        String applicantEmail,
        String reason) {
}
