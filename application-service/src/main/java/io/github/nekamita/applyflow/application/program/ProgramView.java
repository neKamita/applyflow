package io.github.nekamita.applyflow.application.program;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProgramView(
        String id,
        String university,
        String name,
        String country,
        Program.Degree degree,
        BigDecimal applicationFee,
        String currency,
        LocalDate deadline) {
}
