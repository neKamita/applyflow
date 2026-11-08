package io.github.nekamita.applyflow.payment;

import java.time.Clock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.github.nekamita.applyflow.common.events.ApplicationSubmitted;
import io.github.nekamita.applyflow.common.events.EventEnvelope;
import io.github.nekamita.applyflow.common.events.EventTypes;
import io.github.nekamita.applyflow.common.events.PaymentCompleted;
import io.github.nekamita.applyflow.common.events.PaymentFailed;
import io.github.nekamita.applyflow.common.outbox.InboxStore;
import io.github.nekamita.applyflow.common.outbox.OutboxWriter;
import io.github.nekamita.applyflow.payment.provider.PaymentProvider;
import io.github.nekamita.applyflow.payment.provider.PaymentProvider.Approved;
import io.github.nekamita.applyflow.payment.provider.PaymentProvider.ChargeResult;
import io.github.nekamita.applyflow.payment.provider.PaymentProvider.Declined;
import io.github.nekamita.applyflow.payment.provider.PaymentProviderUnavailableException;
import io.micrometer.core.instrument.MeterRegistry;

@Service
public class PaymentProcessor {

    static final String CONSUMER = "payment-service.application-submitted";

    private static final Logger log = LoggerFactory.getLogger(PaymentProcessor.class);

    private final PaymentRepository paymentRepository;
    private final PaymentProvider paymentProvider;
    private final InboxStore inboxStore;
    private final OutboxWriter outboxWriter;
    private final MeterRegistry meterRegistry;
    private final Clock clock;

    public PaymentProcessor(PaymentRepository paymentRepository, PaymentProvider paymentProvider, InboxStore inboxStore,
                            OutboxWriter outboxWriter, MeterRegistry meterRegistry, Clock clock) {
        this.paymentRepository = paymentRepository;
        this.paymentProvider = paymentProvider;
        this.inboxStore = inboxStore;
        this.outboxWriter = outboxWriter;
        this.meterRegistry = meterRegistry;
        this.clock = clock;
    }

    /**
     * Charges the application fee and records the outcome together with its event.
     *
     * <p>If the provider is unavailable the exception rolls the transaction back, including the inbox
     * record, and the listener's retry policy redelivers the message. The provider call happens inside
     * the transaction; that holds a database connection for the duration of the call, which is acceptable
     * at this scale and keeps the flow simple.
     */
    @Transactional
    public void process(EventEnvelope<ApplicationSubmitted> event) {
        ApplicationSubmitted application = event.payload();
        if (!inboxStore.markProcessed(event.eventId(), CONSUMER)) {
            log.info("Skipping duplicate event {}", event.eventId());
            return;
        }
        if (paymentRepository.existsByApplicationId(application.applicationId())) {
            log.warn("Application {} already has a payment, ignoring event {}", application.applicationId(), event.eventId());
            return;
        }

        ChargeResult result;
        try {
            result = paymentProvider.charge(application.applicationId().toString(),
                    application.feeAmount(), application.currency(), application.paymentToken());
        } catch (PaymentProviderUnavailableException e) {
            log.warn("Charge for application {} failed transiently, the message will be retried: {}",
                    application.applicationId(), e.getMessage());
            meterRegistry.counter("applyflow.payments", "outcome", "transient_failure").increment();
            throw e;
        }

        switch (result) {
            case Approved approved -> {
                Payment payment = paymentRepository.save(Payment.completed(application.applicationId(),
                        application.applicantId(), application.feeAmount(), application.currency(),
                        approved.providerReference(), clock.instant()));
                outboxWriter.append(EventTypes.PAYMENT_COMPLETED, application.applicationId().toString(),
                        new PaymentCompleted(payment.getId(), application.applicationId(), application.applicantId(),
                                application.applicantEmail(), application.feeAmount(), application.currency()));
                log.info("Charged {} {} for application {}", application.feeAmount(), application.currency(),
                        application.applicationId());
                meterRegistry.counter("applyflow.payments", "outcome", "completed").increment();
            }
            case Declined declined -> {
                paymentRepository.save(Payment.declined(application.applicationId(), application.applicantId(),
                        application.feeAmount(), application.currency(), declined.reason(), clock.instant()));
                outboxWriter.append(EventTypes.PAYMENT_FAILED, application.applicationId().toString(),
                        new PaymentFailed(application.applicationId(), application.applicantId(),
                                application.applicantEmail(), declined.reason()));
                log.info("Payment for application {} declined: {}", application.applicationId(), declined.reason());
                meterRegistry.counter("applyflow.payments", "outcome", "declined").increment();
            }
        }
    }
}
