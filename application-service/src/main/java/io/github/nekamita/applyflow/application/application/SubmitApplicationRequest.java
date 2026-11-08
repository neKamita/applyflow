package io.github.nekamita.applyflow.application.application;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * @param paymentToken token from the payment provider's client SDK; the demo provider understands
 *                     {@code tok_visa} (approved), {@code tok_declined} and {@code tok_unavailable}
 */
public record SubmitApplicationRequest(
        @NotBlank @Size(max = 64) String programId,
        @NotBlank @Email @Size(max = 254) String applicantEmail,
        @NotBlank @Size(max = 100) @Pattern(regexp = "tok_[A-Za-z0-9_]+") String paymentToken) {
}
