package io.github.nekamita.applyflow.common.messaging;

import java.util.ArrayList;
import java.util.List;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarable;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.ExchangeBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;

/**
 * RabbitMQ topology. Producers only know the events exchange; each consumer declares and owns its queue,
 * so adding a new consumer never requires a change in the producer.
 *
 * <pre>
 * producer -> applyflow.events (topic) -> consumer queue
 *                                            | rejected after retries
 *                                            v
 *                                         applyflow.dlx (direct) -> consumer queue .dlq
 * </pre>
 */
public final class Topology {

    public static final String EVENTS_EXCHANGE = "applyflow.events";
    public static final String DEAD_LETTER_EXCHANGE = "applyflow.dlx";
    public static final String DLQ_SUFFIX = ".dlq";

    private Topology() {
    }

    public static TopicExchange eventsExchange() {
        return ExchangeBuilder.topicExchange(EVENTS_EXCHANGE).durable(true).build();
    }

    /**
     * Declares a durable consumer queue bound to the given routing keys, plus its dead-letter queue.
     * Messages that still fail after the listener's retry policy are dead-lettered instead of being lost
     * or redelivered forever.
     */
    public static Declarables consumerQueue(String queueName, String... routingKeys) {
        TopicExchange events = eventsExchange();
        DirectExchange deadLetters = ExchangeBuilder.directExchange(DEAD_LETTER_EXCHANGE).durable(true).build();

        Queue queue = QueueBuilder.durable(queueName)
                .deadLetterExchange(DEAD_LETTER_EXCHANGE)
                .deadLetterRoutingKey(queueName + DLQ_SUFFIX)
                .build();
        Queue deadLetterQueue = QueueBuilder.durable(queueName + DLQ_SUFFIX).build();

        List<Declarable> declarables = new ArrayList<>(List.of(events, deadLetters, queue, deadLetterQueue));
        declarables.add(BindingBuilder.bind(deadLetterQueue).to(deadLetters).with(queueName + DLQ_SUFFIX));
        for (String routingKey : routingKeys) {
            Binding binding = BindingBuilder.bind(queue).to(events).with(routingKey);
            declarables.add(binding);
        }
        return new Declarables(declarables);
    }
}
