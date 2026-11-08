package io.github.nekamita.applyflow.application.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import io.github.nekamita.applyflow.application.program.Program;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "applications")
public class StudentApplication {

    @Id
    private UUID id;

    @Column(name = "applicant_id", nullable = false)
    private String applicantId;

    @Column(name = "applicant_email", nullable = false)
    private String applicantEmail;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_id")
    private Program program;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    /** Copied from the program at submission time, so a later price change does not affect it. */
    @Column(name = "fee_amount", nullable = false)
    private BigDecimal feeAmount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "idempotency_key", nullable = false)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    protected StudentApplication() {
    }

    public static StudentApplication submit(String applicantId, String applicantEmail, Program program,
                                            String idempotencyKey, Instant now) {
        StudentApplication application = new StudentApplication();
        application.id = UUID.randomUUID();
        application.applicantId = applicantId;
        application.applicantEmail = applicantEmail;
        application.program = program;
        application.status = ApplicationStatus.SUBMITTED;
        application.feeAmount = program.getFeeAmount();
        application.currency = program.getCurrency();
        application.idempotencyKey = idempotencyKey;
        application.createdAt = now;
        application.updatedAt = now;
        return application;
    }

    /** @return {@code false} if the application already reached a final status */
    public boolean markPaid(Instant now) {
        return transitionTo(ApplicationStatus.PAID, null, now);
    }

    /** @return {@code false} if the application already reached a final status */
    public boolean markPaymentFailed(String reason, Instant now) {
        return transitionTo(ApplicationStatus.PAYMENT_FAILED, reason, now);
    }

    private boolean transitionTo(ApplicationStatus target, String reason, Instant now) {
        if (status != ApplicationStatus.SUBMITTED) {
            return false;
        }
        status = target;
        failureReason = reason;
        updatedAt = now;
        return true;
    }

    public ApplicationView toView() {
        return new ApplicationView(id, program.getId(), program.getName(), program.getUniversity(), status,
                feeAmount, currency, failureReason, createdAt, updatedAt);
    }

    public UUID getId() {
        return id;
    }

    public String getApplicantId() {
        return applicantId;
    }

    public String getApplicantEmail() {
        return applicantEmail;
    }

    public Program getProgram() {
        return program;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public BigDecimal getFeeAmount() {
        return feeAmount;
    }

    public String getCurrency() {
        return currency;
    }
}
