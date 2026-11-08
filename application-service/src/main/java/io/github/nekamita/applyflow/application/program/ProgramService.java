package io.github.nekamita.applyflow.application.program;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Read-mostly catalog. It changes a few times a year but is read on every page load, so it is cached in
 * Redis (shared by all replicas) with a TTL instead of hitting PostgreSQL each time.
 */
@Service
public class ProgramService {

    public static final String PROGRAM_CACHE = "program";
    public static final String CATALOG_CACHE = "program-catalog";

    private final ProgramRepository programRepository;

    public ProgramService(ProgramRepository programRepository) {
        this.programRepository = programRepository;
    }

    @Cacheable(cacheNames = CATALOG_CACHE, key = "'all'")
    @Transactional(readOnly = true)
    public ProgramCatalog catalog() {
        return new ProgramCatalog(programRepository.findAllByOrderByUniversityAscNameAsc().stream()
                .map(Program::toView)
                .toList());
    }

    @Cacheable(cacheNames = PROGRAM_CACHE, key = "#programId")
    @Transactional(readOnly = true)
    public ProgramView get(String programId) {
        return programRepository.findById(programId)
                .map(Program::toView)
                .orElseThrow(() -> new ProgramNotFoundException(programId));
    }
}
