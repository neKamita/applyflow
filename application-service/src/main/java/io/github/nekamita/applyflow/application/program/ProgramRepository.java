package io.github.nekamita.applyflow.application.program;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgramRepository extends JpaRepository<Program, String> {

    List<Program> findAllByOrderByUniversityAscNameAsc();
}
