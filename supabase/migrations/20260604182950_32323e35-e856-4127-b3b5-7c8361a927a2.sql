ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;
ALTER TABLE public.messages REPLICA IDENTITY FULL;