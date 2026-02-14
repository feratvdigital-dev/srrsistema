
-- Tabela de técnicos
CREATE TABLE public.technicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  specialty TEXT NOT NULL DEFAULT 'both' CHECK (specialty IN ('hydraulic', 'electrical', 'both')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  rg TEXT,
  cpf TEXT,
  profile_photo TEXT,
  document_photo TEXT,
  username TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de ordens de serviço
CREATE TABLE public.service_orders (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL DEFAULT '',
  client_email TEXT NOT NULL DEFAULT '',
  service_type TEXT NOT NULL DEFAULT 'both' CHECK (service_type IN ('hydraulic', 'electrical', 'both')),
  address TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  description TEXT NOT NULL DEFAULT '',
  observation TEXT NOT NULL DEFAULT '',
  photos_before TEXT[] DEFAULT '{}',
  photos_during TEXT[] DEFAULT '{}',
  photos_after TEXT[] DEFAULT '{}',
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  material_cost NUMERIC NOT NULL DEFAULT 0,
  material_description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'executing', 'executed', 'closed')),
  assigned_technician TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de chamados de clientes
CREATE TABLE public.client_tickets (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  description TEXT NOT NULL DEFAULT '',
  photos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed')),
  linked_order_id INTEGER REFERENCES public.service_orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de usuários do sistema (admin)
CREATE TABLE public.app_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir usuário admin padrão
INSERT INTO public.app_users (username, password, role) VALUES ('srresolve', 'sr604320', 'admin');

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para acesso anônimo (sistema interno com autenticação própria)
CREATE POLICY "Allow all access to technicians" ON public.technicians FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to service_orders" ON public.service_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to client_tickets" ON public.client_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true);

-- Habilitar realtime para atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_tickets;
