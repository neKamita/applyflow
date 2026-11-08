package io.github.nekamita.applyflow.application.application;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.nekamita.applyflow.application.idempotency.IdempotentSubmission;
import io.github.nekamita.applyflow.application.idempotency.IdempotentSubmission.Result;
import io.github.nekamita.applyflow.application.web.Headers;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;

/**
 * The applicant id comes from {@value Headers#USER_ID}, which only the gateway sets after validating
 * the JWT. The service is not reachable from outside the cluster (see k8s/network-policy.yaml).
 */
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final IdempotentSubmission idempotentSubmission;

    public ApplicationController(ApplicationService applicationService, IdempotentSubmission idempotentSubmission) {
        this.applicationService = applicationService;
        this.idempotentSubmission = idempotentSubmission;
    }

    @PostMapping
    public ResponseEntity<ApplicationView> submit(
            @RequestHeader(Headers.USER_ID) String applicantId,
            @RequestHeader(Headers.IDEMPOTENCY_KEY) @Pattern(regexp = "[A-Za-z0-9-]{8,100}") String idempotencyKey,
            @Valid @RequestBody SubmitApplicationRequest request) {
        Result result = idempotentSubmission.submit(applicantId, idempotencyKey, request);
        if (result.replayed()) {
            return ResponseEntity.ok().header(Headers.IDEMPOTENT_REPLAYED, "true").body(result.application());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(result.application());
    }

    @GetMapping
    public List<ApplicationView> mine(@RequestHeader(Headers.USER_ID) String applicantId) {
        return applicationService.listForApplicant(applicantId);
    }

    @GetMapping("/{applicationId}")
    public ApplicationView get(@RequestHeader(Headers.USER_ID) String applicantId, @PathVariable UUID applicationId) {
        return applicationService.get(applicationId, applicantId);
    }
}
