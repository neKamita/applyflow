package io.github.nekamita.applyflow.application.application;

public class DeadlinePassedException extends RuntimeException {

    public DeadlinePassedException(String programId) {
        super("The application deadline for program " + programId + " has passed");
    }
}
