package io.github.nekamita.applyflow.application.program;

public class ProgramNotFoundException extends RuntimeException {

    public ProgramNotFoundException(String programId) {
        super("Program " + programId + " does not exist");
    }
}
