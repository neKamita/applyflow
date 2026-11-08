package io.github.nekamita.applyflow.payment.provider;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Behaves like a provider's test mode:
 * <ul>
 *   <li>{@code tok_declined}: the card is declined (a business outcome, not retried)</li>
 *   <li>{@code tok_unavailable}: the provider is always down (retried, then dead-lettered)</li>
 *   <li>any other token: approved, except for a configurable share of random transient failures</li>
 * </ul>
 */
@Component
public class SimulatedPaymentProvider implements PaymentProvider {

    private final double transientFailureRate;

    public SimulatedPaymentProvider(@Value("${applyflow.payment-gateway.transient-failure-rate:0.0}") double transientFailureRate) {
        this.transientFailureRate = transientFailureRate;
    }

    @Override
    public ChargeResult charge(String idempotencyKey, BigDecimal amount, String currency, String paymentToken) {
        if ("tok_unavailable".equals(paymentToken)) {
            throw new PaymentProviderUnavailableException("Payment provider is unavailable");
        }
        if (ThreadLocalRandom.current().nextDouble() < transientFailureRate) {
            throw new PaymentProviderUnavailableException("Payment provider timed out");
        }
        if ("tok_declined".equals(paymentToken)) {
            return new Declined("Card declined by issuer");
        }
        return new Approved("sim_" + UUID.nameUUIDFromBytes(idempotencyKey.getBytes()));
    }
}
