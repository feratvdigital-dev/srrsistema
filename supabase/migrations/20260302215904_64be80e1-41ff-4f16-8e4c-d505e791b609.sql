
ALTER TABLE public.expenses ADD COLUMN order_id integer REFERENCES public.service_orders(id) ON DELETE SET NULL;
