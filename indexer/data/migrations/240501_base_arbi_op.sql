
-- Table: public.base_events
DROP TABLE IF EXISTS public.base_events;
CREATE TABLE IF NOT EXISTS public.base_events
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
CREATE INDEX idx_base_events_sn ON public.base_events(sn);
CREATE INDEX idx_base_events_reqId ON public.base_events(reqId);
CREATE INDEX idx_base_events_event ON public.base_events(event);
CREATE INDEX idx_base_events_tx_hash ON public.base_events(tx_hash);


-- Table: public.arbitrum_events
DROP TABLE IF EXISTS public.arbitrum_events;
CREATE TABLE IF NOT EXISTS public.arbitrum_events
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
CREATE INDEX idx_arbitrum_events_sn ON public.arbitrum_events(sn);
CREATE INDEX idx_arbitrum_events_reqId ON public.arbitrum_events(reqId);
CREATE INDEX idx_arbitrum_events_event ON public.arbitrum_events(event);
CREATE INDEX idx_arbitrum_events_tx_hash ON public.arbitrum_events(tx_hash);


-- Table: public.optimism_events
DROP TABLE IF EXISTS public.optimism_events;
CREATE TABLE IF NOT EXISTS public.optimism_events
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
CREATE INDEX idx_optimism_events_sn ON public.optimism_events(sn);
CREATE INDEX idx_optimism_events_reqId ON public.optimism_events(reqId);
CREATE INDEX idx_optimism_events_event ON public.optimism_events(event);
CREATE INDEX idx_optimism_events_tx_hash ON public.optimism_events(tx_hash);