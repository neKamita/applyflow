package io.github.nekamita.applyflow.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Stand-in for an e-mail provider: logs instead of sending. Swapping in SMTP or SES only touches this class.
 */
@Component
public class NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(NotificationSender.class);

    public void send(Notification notification) {
        log.info("E-mail to {}: {}", mask(notification.recipient()), notification.subject());
    }

    /** Logs must not contain full e-mail addresses. */
    static String mask(String email) {
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***" + (at >= 0 ? email.substring(at) : "");
        }
        return email.charAt(0) + "***" + email.substring(at);
    }
}
