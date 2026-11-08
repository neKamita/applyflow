package io.github.nekamita.applyflow.payment.web;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.nekamita.applyflow.payment.Payment;
import io.github.nekamita.applyflow.payment.Payment.PaymentView;
import io.github.nekamita.applyflow.payment.PaymentRepository;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentRepository paymentRepository;

    public PaymentController(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    /** 404 until the payment has been processed, or if the application belongs to someone else. */
    @GetMapping("/{applicationId}")
    public ResponseEntity<PaymentView> byApplication(@RequestHeader("X-User-Id") String applicantId,
                                                     @PathVariable UUID applicationId) {
        return ResponseEntity.of(paymentRepository.findByApplicationIdAndApplicantId(applicationId, applicantId)
                .map(Payment::toView));
    }
}
