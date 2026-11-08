package io.github.nekamita.applyflow.application.program;

import java.util.List;

/** Wrapper so the whole catalog can be cached as one typed Redis value. */
public record ProgramCatalog(List<ProgramView> programs) {
}
