-- Table: public.messages
DROP TABLE IF EXISTS public.messages;
CREATE TABLE IF NOT EXISTS public.messages
(
    id serial PRIMARY KEY,
    sn bigint,

    "status" varchar(20),

    src_network varchar(20),
    src_block_number bigint,
    src_block_timestamp bigint,
    src_tx_hash varchar(100),
    src_app varchar(100),
    src_error varchar(100),

    dest_network varchar(20),
    dest_block_number bigint,
    dest_block_timestamp bigint,
    dest_tx_hash varchar(100),
    dest_app varchar(100),
    dest_error varchar(100),

    response_block_number bigint,
    response_block_timestamp bigint,
    response_tx_hash varchar(100),
    response_error varchar(100),

    rollback_block_number bigint,
    rollback_block_timestamp bigint,
    rollback_tx_hash varchar(100),
    rollback_error varchar(100),

    "value" varchar(50),
    "fee" varchar(50),

    created_at bigint,
    updated_at bigint,
    synced boolean DEFAULT false
);
CREATE INDEX idx_messages_sn ON public.messages(sn);
CREATE INDEX idx_messages_status ON public.messages(status);
CREATE INDEX idx_messages_src_network ON public.messages(src_network);
CREATE INDEX idx_messages_dest_network ON public.messages(dest_network);
CREATE INDEX idx_messages_src_app ON public.messages(src_app);



-- Table: public.counter
DROP TABLE IF EXISTS public.counter;
CREATE TABLE IF NOT EXISTS public.counter
(
    "name" varchar(50) NOT NULL,
    "value" bigint,
    CONSTRAINT counter_pkey PRIMARY KEY (name)
);


-- Table: public.icon_events
DROP TABLE IF EXISTS public.icon_events;
CREATE TABLE IF NOT EXISTS public.icon_events
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
CREATE INDEX idx_icon_events_sn ON public.icon_events(sn);
CREATE INDEX idx_icon_events_reqId ON public.icon_events(sn);
CREATE INDEX idx_icon_events_event ON public.icon_events(event);
CREATE INDEX idx_icon_events_tx_hash ON public.icon_events(tx_hash);

-- Table: public.eth2_events
DROP TABLE IF EXISTS public.eth2_events;
CREATE TABLE IF NOT EXISTS public.eth2_events
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
CREATE INDEX idx_eth2_events_sn ON public.eth2_events(sn);
CREATE INDEX idx_eth2_events_reqId ON public.eth2_events(reqId);
CREATE INDEX idx_eth2_events_event ON public.eth2_events(event);
CREATE INDEX idx_eth2_events_tx_hash ON public.eth2_events(tx_hash);


-- Table: public.bsc_events
DROP TABLE IF EXISTS public.bsc_events;
CREATE TABLE IF NOT EXISTS public.bsc_events
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
CREATE INDEX idx_bsc_events_sn ON public.bsc_events(sn);
CREATE INDEX idx_bsc_events_reqId ON public.bsc_events(reqId);
CREATE INDEX idx_bsc_events_event ON public.bsc_events(event);
CREATE INDEX idx_bsc_events_tx_hash ON public.bsc_events(tx_hash);

-- Table: public.havah_events
DROP TABLE IF EXISTS public.havah_events;
CREATE TABLE IF NOT EXISTS public.havah_events
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
CREATE INDEX idx_havah_events_sn ON public.havah_events(sn);
CREATE INDEX idx_havah_events_reqId ON public.havah_events(reqId);
CREATE INDEX idx_havah_events_event ON public.havah_events(event);
CREATE INDEX idx_havah_events_tx_hash ON public.havah_events(tx_hash);

-- DROP TABLE IF EXISTS public.coingecko_markets;
-- CREATE TABLE IF NOT EXISTS public.coingecko_markets
-- (
--     asset varchar(50) NOT NULL,
--     "data" JSONB,
--     CONSTRAINT coingecko_markets_pkey PRIMARY KEY (asset)
-- );


-- Table: public.sui_events
DROP TABLE IF EXISTS public.sui_events;
CREATE TABLE IF NOT EXISTS public.sui_events
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
CREATE INDEX idx_sui_events_sn ON public.sui_events(sn);
CREATE INDEX idx_sui_events_reqId ON public.sui_events(reqId);
CREATE INDEX idx_sui_events_event ON public.sui_events(event);
CREATE INDEX idx_sui_events_tx_hash ON public.sui_events(tx_hash);