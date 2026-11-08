package io.github.nekamita.applyflow.notification;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationStore store;

    public NotificationController(NotificationStore store) {
        this.store = store;
    }

    @GetMapping("/{applicationId}")
    public List<Notification> forApplication(@RequestHeader("X-User-Id") String applicantId,
                                             @PathVariable UUID applicationId) {
        return store.forApplication(applicationId).stream()
                .filter(notification -> notification.applicantId().equals(applicantId))
                .toList();
    }
}
