
-- Table: public.avax_events
DROP TABLE IF EXISTS public.avax_events;
CREATE TABLE IF NOT EXISTS public.avax_events
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
CREATE INDEX idx_avax_events_sn ON public.avax_events(sn);
CREATE INDEX idx_avax_events_reqId ON public.avax_events(reqId);
CREATE INDEX idx_avax_events_event ON public.avax_events(event);
CREATE INDEX idx_avax_events_tx_hash ON public.avax_events(tx_hash);