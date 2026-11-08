package io.github.nekamita.applyflow.application.idempotency;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import io.github.nekamita.applyflow.application.application.SubmitApplicationRequest;

class IdempotentSubmissionTest {

    @Test
    void fingerprintIsStableForTheSameBodyAndDiffersForAnyChangedField() {
        SubmitApplicationRequest request = new SubmitApplicationRequest("bham-msc-cs", "a@example.com", "tok_visa");

        assertThat(IdempotentSubmission.fingerprint(request))
                .isEqualTo(IdempotentSubmission.fingerprint(new SubmitApplicationRequest("bham-msc-cs", "a@example.com", "tok_visa")))
                .isNotEqualTo(IdempotentSubmission.fingerprint(new SubmitApplicationRequest("kaist-msc-ai", "a@example.com", "tok_visa")))
                .isNotEqualTo(IdempotentSubmission.fingerprint(new SubmitApplicationRequest("bham-msc-cs", "b@example.com", "tok_visa")))
                .isNotEqualTo(IdempotentSubmission.fingerprint(new SubmitApplicationRequest("bham-msc-cs", "a@example.com", "tok_declined")));
    }
}
