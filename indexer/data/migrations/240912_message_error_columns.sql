ALTER TABLE public.messages ALTER COLUMN src_error TYPE VARCHAR;
ALTER TABLE public.messages ALTER COLUMN dest_error TYPE VARCHAR;
ALTER TABLE public.messages ALTER COLUMN response_error TYPE VARCHAR;
ALTER TABLE public.messages ALTER COLUMN rollback_error TYPE VARCHAR;