package io.github.nekamita.applyflow.application.application;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.github.nekamita.applyflow.application.program.Program;
import io.github.nekamita.applyflow.application.program.ProgramNotFoundException;
import io.github.nekamita.applyflow.application.program.ProgramRepository;
import io.github.nekamita.applyflow.common.events.ApplicationSubmitted;
import io.github.nekamita.applyflow.common.events.EventTypes;
import io.github.nekamita.applyflow.common.events.PaymentCompleted;
import io.github.nekamita.applyflow.common.events.PaymentFailed;
import io.github.nekamita.applyflow.common.outbox.OutboxWriter;

@Service
public class ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

    private final ApplicationRepository applicationRepository;
    private final ProgramRepository programRepository;
    private final OutboxWriter outboxWriter;
    private final Clock clock;

    public ApplicationService(ApplicationRepository applicationRepository, ProgramRepository programRepository,
                              OutboxWriter outboxWriter, Clock clock) {
        this.applicationRepository = applicationRepository;
        this.programRepository = programRepository;
        this.outboxWriter = outboxWriter;
        this.clock = clock;
    }

    /**
     * Saves the application and its {@code application.submitted} event in one transaction.
     * The payment is triggered asynchronously, so the student gets a response without waiting for it.
     */
    @Transactional
    public ApplicationView submit(String applicantId, String idempotencyKey, SubmitApplicationRequest request) {
        Program program = programRepository.findById(request.programId())
                .orElseThrow(() -> new ProgramNotFoundException(request.programId()));
        if (!program.acceptsApplicationsOn(LocalDate.now(clock))) {
            throw new DeadlinePassedException(program.getId());
        }

        StudentApplication application = StudentApplication.submit(
                applicantId, request.applicantEmail(), program, idempotencyKey, clock.instant());
        applicationRepository.saveAndFlush(application);

        outboxWriter.append(EventTypes.APPLICATION_SUBMITTED, application.getId().toString(), new ApplicationSubmitted(
                application.getId(), applicantId, request.applicantEmail(), program.getId(), program.getName(),
                application.getFeeAmount(), application.getCurrency(), request.paymentToken()));

        log.info("Application {} submitted for program {}", application.getId(), program.getId());
        return application.toView();
    }

    @Transactional(readOnly = true)
    public ApplicationView get(UUID applicationId, String applicantId) {
        // Another student's application is reported as missing, so ids cannot be probed.
        return applicationRepository.findByIdAndApplicantId(applicationId, applicantId)
                .map(StudentApplication::toView)
                .orElseThrow(() -> new ApplicationNotFoundException(applicationId));
    }

    @Transactional(readOnly = true)
    public Optional<ApplicationView> findByIdempotencyKey(String applicantId, String idempotencyKey) {
        return applicationRepository.findByApplicantIdAndIdempotencyKey(applicantId, idempotencyKey)
                .map(StudentApplication::toView);
    }

    @Transactional(readOnly = true)
    public List<ApplicationView> listForApplicant(String applicantId) {
        return applicationRepository.findTop50ByApplicantIdOrderByCreatedAtDesc(applicantId).stream()
                .map(StudentApplication::toView)
                .toList();
    }

    @Transactional
    public void onPaymentCompleted(PaymentCompleted event) {
        StudentApplication application = load(event.applicationId());
        if (application.markPaid(clock.instant())) {
            log.info("Application {} paid", application.getId());
        } else {
            log.warn("Ignoring payment for application {} in final status {}", application.getId(), application.getStatus());
        }
    }

    @Transactional
    public void onPaymentFailed(PaymentFailed event) {
        StudentApplication application = load(event.applicationId());
        if (application.markPaymentFailed(event.reason(), clock.instant())) {
            log.info("Payment for application {} failed: {}", application.getId(), event.reason());
        } else {
            log.warn("Ignoring failed payment for application {} in final status {}", application.getId(), application.getStatus());
        }
    }

    private StudentApplication load(UUID applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApplicationNotFoundException(applicationId));
    }
}
