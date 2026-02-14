-- Drop existing foreign key and recreate with ON DELETE SET NULL
ALTER TABLE public.client_tickets
  DROP CONSTRAINT IF EXISTS client_tickets_linked_order_id_fkey;

ALTER TABLE public.client_tickets
  ADD CONSTRAINT client_tickets_linked_order_id_fkey
  FOREIGN KEY (linked_order_id)
  REFERENCES public.service_orders(id)
  ON DELETE SET NULL;