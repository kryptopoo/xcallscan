ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS action_type VARCHAR;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS action_detail VARCHAR;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS action_amount_usd VARCHAR;