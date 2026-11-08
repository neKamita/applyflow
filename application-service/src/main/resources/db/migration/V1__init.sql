CREATE TABLE programs (
    id            VARCHAR(64)    PRIMARY KEY,
    university    VARCHAR(200)   NOT NULL,
    name          VARCHAR(200)   NOT NULL,
    country       VARCHAR(80)    NOT NULL,
    degree        VARCHAR(40)    NOT NULL,
    fee_amount    NUMERIC(10, 2) NOT NULL CHECK (fee_amount >= 0),
    currency      VARCHAR(3)      NOT NULL,
    deadline      DATE           NOT NULL
);

CREATE TABLE applications (
    id               UUID          PRIMARY KEY,
    applicant_id     VARCHAR(100)  NOT NULL,
    applicant_email  VARCHAR(254)  NOT NULL,
    program_id       VARCHAR(64)   NOT NULL REFERENCES programs (id),
    status           VARCHAR(20)   NOT NULL,
    fee_amount       NUMERIC(10, 2) NOT NULL,
    currency         VARCHAR(3)     NOT NULL,
    failure_reason   VARCHAR(500),
    idempotency_key  VARCHAR(100)  NOT NULL,
    created_at       TIMESTAMPTZ   NOT NULL,
    updated_at       TIMESTAMPTZ   NOT NULL,
    version          BIGINT        NOT NULL DEFAULT 0,
    -- Backstop for the Redis idempotency check: survives a Redis flush or failover.
    CONSTRAINT uq_applications_idempotency UNIQUE (applicant_id, idempotency_key)
);

CREATE INDEX idx_applications_applicant ON applications (applicant_id, created_at DESC);

-- Transactional outbox, see common/outbox.
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

-- Inbox for idempotent consumers, see common/outbox/InboxStore.
CREATE TABLE processed_messages (
    event_id      UUID         NOT NULL,
    consumer      VARCHAR(100) NOT NULL,
    processed_at  TIMESTAMPTZ  NOT NULL,
    PRIMARY KEY (event_id, consumer)
);
