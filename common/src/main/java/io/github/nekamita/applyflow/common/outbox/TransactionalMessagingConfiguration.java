package io.github.nekamita.applyflow.common.outbox;

import java.time.Clock;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.support.TransactionTemplate;

import io.github.nekamita.applyflow.common.messaging.EventCodec;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
class TransactionalMessagingConfiguration {

    @Bean
    OutboxWriter outboxWriter(JdbcClient jdbcClient, EventCodec eventCodec) {
        return new OutboxWriter(jdbcClient, eventCodec, Clock.systemUTC());
    }

    @Bean
    OutboxRelay outboxRelay(JdbcClient jdbcClient, RabbitTemplate rabbitTemplate, TransactionTemplate transactionTemplate,
                            @Value("${applyflow.outbox.batch-size:50}") int batchSize,
                            @Value("${applyflow.outbox.confirm-timeout-ms:5000}") long confirmTimeoutMs,
                            @Value("${applyflow.outbox.retention-days:7}") int retentionDays) {
        return new OutboxRelay(jdbcClient, rabbitTemplate, transactionTemplate, batchSize, confirmTimeoutMs, retentionDays);
    }

    @Bean
    InboxStore inboxStore(JdbcClient jdbcClient) {
        return new InboxStore(jdbcClient);
    }
}
