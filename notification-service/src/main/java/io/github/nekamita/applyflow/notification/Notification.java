package io.github.nekamita.applyflow.notification;

import java.time.Instant;
import java.util.UUID;

/**
 * @param eventId the event that caused the notification; identical ids mean a duplicate
 */
public record Notification(
        UUID eventId,
        UUID applicationId,
        String applicantId,
        String recipient,
        String subject,
        String body,
        Instant sentAt) {
}
