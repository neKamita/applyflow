package io.github.nekamita.applyflow.payment.provider;

import java.math.BigDecimal;

/**
 * Port to an external payment provider (Stripe, Payme, Click...). Kept behind an interface so the
 * simulated provider can be swapped for a real one without touching the payment flow.
 */
public interface PaymentProvider {

    /**
     * @param idempotencyKey the provider must return the original result for a repeated key, so a retry
     *                       after a timeout never charges the card twice
     * @throws PaymentProviderUnavailableException on a transient failure; the caller should retry
     */
    ChargeResult charge(String idempotencyKey, BigDecimal amount, String currency, String paymentToken);

    sealed interface ChargeResult {
    }

    record Approved(String providerReference) implements ChargeResult {
    }

    record Declined(String reason) implements ChargeResult {
    }
}
