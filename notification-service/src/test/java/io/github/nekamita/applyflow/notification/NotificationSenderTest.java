package io.github.nekamita.applyflow.notification;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class NotificationSenderTest {

    @Test
    void masksEmailAddressesInLogs() {
        assertThat(NotificationSender.mask("aziz@example.com")).isEqualTo("a***@example.com");
        assertThat(NotificationSender.mask("a@example.com")).isEqualTo("***@example.com");
        assertThat(NotificationSender.mask("not-an-email")).isEqualTo("***");
    }
}
