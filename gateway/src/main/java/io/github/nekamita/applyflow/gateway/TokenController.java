package io.github.nekamita.applyflow.gateway;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import reactor.core.publisher.Mono;

/** Issues short-lived access tokens for the demo accounts. */
@RestController
class TokenController {

    static final String ISSUER = "applyflow-gateway";

    private final ReactiveAuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final AuthProperties properties;
    private final Clock clock = Clock.systemUTC();

    TokenController(ReactiveAuthenticationManager authenticationManager, JwtEncoder jwtEncoder, AuthProperties properties) {
        this.authenticationManager = authenticationManager;
        this.jwtEncoder = jwtEncoder;
        this.properties = properties;
    }

    @PostMapping("/auth/token")
    Mono<TokenResponse> token(@Valid @RequestBody TokenRequest request) {
        return authenticationManager
                .authenticate(UsernamePasswordAuthenticationToken.unauthenticated(request.username(), request.password()))
                .map(this::issue)
                .onErrorMap(AuthenticationException.class,
                        e -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));
    }

    private TokenResponse issue(Authentication authentication) {
        Instant now = clock.instant();
        List<String> roles = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(authentication.getName())
                .issuedAt(now)
                .expiresAt(now.plus(properties.tokenTtl()))
                .claim("roles", roles)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new TokenResponse(token, "Bearer", properties.tokenTtl().toSeconds());
    }

    record TokenRequest(@NotBlank String username, @NotBlank String password) {
    }

    record TokenResponse(String accessToken, String tokenType, long expiresIn) {
    }
}
