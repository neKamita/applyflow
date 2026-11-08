package io.github.nekamita.applyflow.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    private UUID id;

    @Column(name = "application_id", nullable = false, unique = true)
    private UUID applicationId;

    @Column(name = "applicant_id", nullable = false)
    private String applicantId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "provider_reference")
    private String providerReference;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Payment() {
    }

    static Payment completed(UUID applicationId, String applicantId, BigDecimal amount, String currency,
                             String providerReference, Instant now) {
        Payment payment = create(applicationId, applicantId, amount, currency, PaymentStatus.COMPLETED, now);
        payment.providerReference = providerReference;
        return payment;
    }

    static Payment declined(UUID applicationId, String applicantId, BigDecimal amount, String currency,
                            String reason, Instant now) {
        Payment payment = create(applicationId, applicantId, amount, currency, PaymentStatus.DECLINED, now);
        payment.failureReason = reason;
        return payment;
    }

    private static Payment create(UUID applicationId, String applicantId, BigDecimal amount, String currency,
                                  PaymentStatus status, Instant now) {
        Payment payment = new Payment();
        payment.id = UUID.randomUUID();
        payment.applicationId = applicationId;
        payment.applicantId = applicantId;
        payment.amount = amount;
        payment.currency = currency;
        payment.status = status;
        payment.createdAt = now;
        return payment;
    }

    public PaymentView toView() {
        return new PaymentView(id, applicationId, amount, currency, status, failureReason, providerReference, createdAt);
    }

    public UUID getId() {
        return id;
    }

    public enum PaymentStatus {
        COMPLETED, DECLINED
    }

    public record PaymentView(UUID id, UUID applicationId, BigDecimal amount, String currency, PaymentStatus status,
                              String failureReason, String providerReference, Instant createdAt) {
    }
}
