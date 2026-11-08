package io.github.nekamita.applyflow.application.program;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/programs")
public class ProgramController {

    private final ProgramService programService;

    public ProgramController(ProgramService programService) {
        this.programService = programService;
    }

    @GetMapping
    public List<ProgramView> list() {
        return programService.catalog().programs();
    }

    @GetMapping("/{programId}")
    public ProgramView get(@PathVariable String programId) {
        return programService.get(programId);
    }
}
