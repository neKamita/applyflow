package io.github.nekamita.applyflow.common.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

class CorrelationIdTest {

    @Test
    void keepsAValidIncomingId() {
        try (MDC.MDCCloseable ignored = CorrelationId.bind("req-42.abc_DEF")) {
            assertThat(CorrelationId.current()).isEqualTo("req-42.abc_DEF");
        }
        assertThat(CorrelationId.current()).isNull();
    }

    @Test
    void replacesMissingOrUnsafeIdsWithAGeneratedOne() {
        for (String unsafe : new String[] {null, "", "  ", "a b", "line\nbreak", "x".repeat(65), "<script>"}) {
            try (MDC.MDCCloseable ignored = CorrelationId.bind(unsafe)) {
                assertThat(CorrelationId.current()).matches("[0-9a-f-]{36}");
            }
        }
    }
}
