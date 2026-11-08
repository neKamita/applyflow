package io.github.nekamita.applyflow.application.program;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "programs")
public class Program {

    @Id
    private String id;

    @Column(nullable = false)
    private String university;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String country;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Degree degree;

    @Column(name = "fee_amount", nullable = false)
    private BigDecimal feeAmount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false)
    private LocalDate deadline;

    protected Program() {
    }

    public boolean acceptsApplicationsOn(LocalDate date) {
        return !date.isAfter(deadline);
    }

    public ProgramView toView() {
        return new ProgramView(id, university, name, country, degree, feeAmount, currency, deadline);
    }

    public String getId() {
        return id;
    }

    public String getUniversity() {
        return university;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getFeeAmount() {
        return feeAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public enum Degree {
        BACHELOR, MASTER, PHD
    }
}
