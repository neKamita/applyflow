package io.github.nekamita.applyflow.application.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ApplicationView(
        UUID id,
        String programId,
        String programName,
        String university,
        ApplicationStatus status,
        BigDecimal applicationFee,
        String currency,
        String failureReason,
        Instant createdAt,
        Instant updatedAt) {
}
