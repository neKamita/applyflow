CREATE TABLE payments (
    id                  UUID           PRIMARY KEY,
    -- One payment per application: a redelivered event can never charge twice.
    application_id      UUID           NOT NULL UNIQUE,
    applicant_id        VARCHAR(100)   NOT NULL,
    amount              NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency            VARCHAR(3)     NOT NULL,
    status              VARCHAR(20)    NOT NULL,
    failure_reason      VARCHAR(500),
    provider_reference  VARCHAR(100),
    created_at          TIMESTAMPTZ    NOT NULL
);

CREATE TABLE outbox_events (
    id              UUID         PRIMARY KEY,
    event_type      VARCHAR(100) NOT NULL,
    aggregate_id    VARCHAR(100) NOT NULL,
    payload         JSONB        NOT NULL,
    correlation_id  VARCHAR(64),
    created_at      TIMESTAMPTZ  NOT NULL,
    published_at    TIMESTAMPTZ
);

CREATE INDEX idx_outbox_unpublished ON outbox_events (created_at) WHERE published_at IS NULL;

CREATE TABLE processed_messages (
    event_id      UUID         NOT NULL,
    consumer      VARCHAR(100) NOT NULL,
    processed_at  TIMESTAMPTZ  NOT NULL,
    PRIMARY KEY (event_id, consumer)
);
