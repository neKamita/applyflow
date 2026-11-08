package io.github.nekamita.applyflow.common.events;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentCompleted(
        UUID paymentId,
        UUID applicationId,
        String applicantId,
        String applicantEmail,
        BigDecimal amount,
        String currency) {
}
