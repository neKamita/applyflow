package io.github.nekamita.applyflow.common.web;

import java.io.IOException;

import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Takes the correlation id set by the gateway (or creates one) and exposes it in the MDC and the response.
 */
public class CorrelationIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try (MDC.MDCCloseable ignored = CorrelationId.bind(request.getHeader(CorrelationId.HEADER))) {
            response.setHeader(CorrelationId.HEADER, CorrelationId.current());
            chain.doFilter(request, response);
        }
    }
}
