package io.github.nekamita.applyflow.application.application;

import java.util.UUID;

public class ApplicationNotFoundException extends RuntimeException {

    public ApplicationNotFoundException(UUID applicationId) {
        super("Application " + applicationId + " does not exist");
    }
}
