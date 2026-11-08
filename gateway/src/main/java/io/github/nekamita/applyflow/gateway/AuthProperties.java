package io.github.nekamita.applyflow.gateway;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * @param jwtSecret HMAC key for HS256; at least 32 bytes, supplied through the {@code JWT_SECRET} variable
 * @param users     demo accounts; a real deployment would delegate login to an identity provider
 */
@Validated
@ConfigurationProperties("applyflow.auth")
public record AuthProperties(
        @NotBlank @Size(min = 32, message = "must be at least 32 characters") String jwtSecret,
        @NotNull Duration tokenTtl,
        @Valid List<User> users) {

    public AuthProperties {
        users = users == null ? List.of() : List.copyOf(users);
    }

    /**
     * @param password encoded password with an id prefix, for example {@code {bcrypt}$2a$10$...}
     */
    public record User(@NotBlank String username, @NotBlank String password, List<String> roles) {

        public User {
            roles = roles == null ? List.of("STUDENT") : List.copyOf(roles);
        }
    }
}
