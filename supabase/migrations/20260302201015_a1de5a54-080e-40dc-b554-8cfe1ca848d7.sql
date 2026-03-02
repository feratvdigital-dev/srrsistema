
-- Table for invoice (NF) requests
CREATE TABLE public.invoice_requests (
  id text NOT NULL PRIMARY KEY,
  order_id integer REFERENCES public.service_orders(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  cpf text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  cep text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  invoice_file_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.invoice_requests ENABLE ROW LEVEL SECURITY;

-- Allow public read/insert (clients need to submit and track)
CREATE POLICY "Allow public insert on invoice_requests"
ON public.invoice_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public select on invoice_requests"
ON public.invoice_requests
FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated update on invoice_requests"
ON public.invoice_requests
FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated delete on invoice_requests"
ON public.invoice_requests
FOR DELETE
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoice_requests;
