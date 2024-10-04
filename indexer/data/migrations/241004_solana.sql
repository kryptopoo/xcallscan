-- Table: public.solana_events
DROP TABLE IF EXISTS public.solana_events;
CREATE TABLE IF NOT EXISTS public.solana_events
(
    id serial PRIMARY KEY,
    "event" varchar(50),
    sn bigint,

    nsn bigint,
    reqId bigint,
    msg varchar,
    code smallint,
    "data" varchar,
    from_raw varchar(200),
    to_raw varchar(200),
    from_decoded varchar(200),
    to_decoded varchar(200),

    block_number bigint,
    block_timestamp bigint,
    tx_hash varchar(100),
    tx_from varchar(100),
    tx_to varchar(100),
    tx_value varchar(50),
    tx_fee varchar(50),

    created_at bigint,
    updated_at bigint
);
CREATE INDEX idx_solana_events_sn ON public.solana_events(sn);
CREATE INDEX idx_solana_events_reqId ON public.solana_events(reqId);
CREATE INDEX idx_solana_events_event ON public.solana_events(event);
CREATE INDEX idx_solana_events_tx_hash ON public.solana_events(tx_hash);