ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS intents_order_id BIGINT DEFAULT 0;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS intents_order_detail VARCHAR;