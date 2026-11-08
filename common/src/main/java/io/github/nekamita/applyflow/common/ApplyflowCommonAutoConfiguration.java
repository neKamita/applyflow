package io.github.nekamita.applyflow.common;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

import io.github.nekamita.applyflow.common.messaging.EventCodec;
import io.github.nekamita.applyflow.common.web.CorrelationIdFilter;
import tools.jackson.databind.json.JsonMapper;

/**
 * Beans every service needs. The outbox and inbox are opt-in through
 * {@link io.github.nekamita.applyflow.common.outbox.EnableTransactionalMessaging}.
 */
@AutoConfiguration
public class ApplyflowCommonAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    EventCodec eventCodec(JsonMapper jsonMapper) {
        return new EventCodec(jsonMapper);
    }

    @Configuration(proxyBeanMethods = false)
    @ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
    static class ServletConfiguration {

        @Bean
        FilterRegistrationBean<CorrelationIdFilter> correlationIdFilter() {
            FilterRegistrationBean<CorrelationIdFilter> registration = new FilterRegistrationBean<>(new CorrelationIdFilter());
            registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
            return registration;
        }
    }
}
