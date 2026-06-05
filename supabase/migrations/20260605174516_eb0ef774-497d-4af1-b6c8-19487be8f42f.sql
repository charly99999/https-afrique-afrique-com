CREATE TABLE public.paydunya_ipn_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  http_status INTEGER NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  paydunya_status TEXT,
  invoice_token TEXT,
  payment_id UUID,
  error TEXT,
  payload JSONB
);

CREATE INDEX paydunya_ipn_logs_received_at_idx ON public.paydunya_ipn_logs (received_at DESC);
CREATE INDEX paydunya_ipn_logs_invoice_token_idx ON public.paydunya_ipn_logs (invoice_token);
CREATE INDEX paydunya_ipn_logs_payment_id_idx ON public.paydunya_ipn_logs (payment_id);

GRANT SELECT ON public.paydunya_ipn_logs TO authenticated;
GRANT ALL ON public.paydunya_ipn_logs TO service_role;

ALTER TABLE public.paydunya_ipn_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view IPN logs"
  ON public.paydunya_ipn_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));