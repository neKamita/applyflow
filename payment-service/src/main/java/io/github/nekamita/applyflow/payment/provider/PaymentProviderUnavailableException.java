package io.github.nekamita.applyflow.payment.provider;

public class PaymentProviderUnavailableException extends RuntimeException {

    public PaymentProviderUnavailableException(String message) {
        super(message);
    }
}
