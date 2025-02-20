ALTER TABLE public.messages ALTER COLUMN intents_order_id TYPE bigint SET DEFAULT 0;
ALTER TABLE public.messages ALTER COLUMN intents_order_detail TYPE VARCHAR;