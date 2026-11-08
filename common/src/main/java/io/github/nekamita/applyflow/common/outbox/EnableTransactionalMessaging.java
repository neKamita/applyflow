package io.github.nekamita.applyflow.common.outbox;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.context.annotation.Import;

/**
 * Enables the transactional outbox (reliable publishing) and inbox (deduplicated consuming).
 * The service must own the {@code outbox_events} and {@code processed_messages} tables;
 * see {@code docs/messaging.md}.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(TransactionalMessagingConfiguration.class)
public @interface EnableTransactionalMessaging {
}
