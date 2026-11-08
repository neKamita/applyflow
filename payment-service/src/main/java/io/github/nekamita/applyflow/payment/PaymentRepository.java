package io.github.nekamita.applyflow.payment;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    boolean existsByApplicationId(UUID applicationId);

    Optional<Payment> findByApplicationIdAndApplicantId(UUID applicationId, String applicantId);
}
