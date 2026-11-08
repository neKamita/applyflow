package io.github.nekamita.applyflow.application.application;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<StudentApplication, UUID> {

    @EntityGraph(attributePaths = "program")
    Optional<StudentApplication> findByIdAndApplicantId(UUID id, String applicantId);

    @EntityGraph(attributePaths = "program")
    Optional<StudentApplication> findByApplicantIdAndIdempotencyKey(String applicantId, String idempotencyKey);

    @EntityGraph(attributePaths = "program")
    List<StudentApplication> findTop50ByApplicantIdOrderByCreatedAtDesc(String applicantId);
}
