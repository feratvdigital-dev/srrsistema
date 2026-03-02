import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';
import logo from '@/assets/logo.png';
import logoItDigital from '@/assets/logo-itdigital.png';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceRequest {
  id: string; fullName: string; cpf: string; email: string; phone: string;
  address: string; cep: string; city: string; status: string;
  invoiceFileUrl: string | null; createdAt: string; completedAt: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'Em Processamento', color: 'bg-blue-100 text-blue-700', icon: FileText },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

const STEPS = ['pending', 'processing', 'completed'] as const;

const mapRow = (row: any): InvoiceRequest => ({
  id: row.id, fullName: row.full_name, cpf: row.cpf, email: row.email, phone: row.phone,
  address: row.address, cep: row.cep, city: row.city, status: row.status,
  invoiceFileUrl: row.invoice_file_url, createdAt: row.created_at, completedAt: row.completed_at,
});

const InvoiceTrack = () => {
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [requests, setRequests] = useState<InvoiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<InvoiceRequest | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const phone = searchParams.get('phone'); const id = searchParams.get('id');
    if (phone) { setSearchValue(phone); searchByPhone(phone); }
    else if (id) { setSearchValue(id); searchById(id); }
  }, [searchParams]);

  const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

  const searchByPhone = async (phone: string) => {
    const normalized = normalizePhone(phone);
    const { data } = await supabase.from('invoice_requests').select('*').order('created_at', { ascending: false });
    if (data) {
      const found = data.filter((row: any) => normalizePhone(row.phone) === normalized).map(mapRow);
      if (found.length > 0) { setRequests(found); setSelectedRequest(null); setNotFound(false); }
      else { setRequests([]); setSelectedRequest(null); setNotFound(true); }
    }
  };

  const searchById = async (id: string) => {
    const { data } = await supabase.from('invoice_requests').select('*').eq('id', id.trim()).maybeSingle();
    if (data) { const mapped = mapRow(data); setRequests([mapped]); setSelectedRequest(mapped); setNotFound(false); }
    else { setRequests([]); setSelectedRequest(null); setNotFound(true); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    await searchByPhone(trimmed);
  };

  const getStepIndex = (status: string) => STEPS.indexOf(status as any);
  const requestToShow = selectedRequest;

  return (
    <div className="min-h-screen bg-background">
      <header className="app-header sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          <img src={logo} alt="SR Resolve" className="h-9 w-auto" />
          <div>
            <h1 className="font-bold text-sm">Acompanhar Nota Fiscal</h1>
            <p className="text-xs opacity-60">Consulte o status da sua NF</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary to-primary/50" />
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-primary opacity-60" />
                </div>
                <h2 className="text-lg font-extrabold">Consulte sua Nota Fiscal</h2>
                <p className="text-sm text-muted-foreground">Digite seu WhatsApp para consultar</p>
              </div>
              <div className="flex gap-2">
                <Input value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="(11) 99999-9999" className="flex-1 rounded-xl h-12" />
                <Button type="submit" className="bg-primary gap-1 rounded-xl h-12 px-5"><Search className="h-4 w-4" /> Buscar</Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {notFound && (
          <Card className="border-0 shadow-sm mt-4 overflow-hidden">
            <div className="h-1 bg-destructive" />
            <CardContent className="p-6 text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <p className="font-semibold text-destructive">Nenhuma solicitação encontrada</p>
              <p className="text-sm text-muted-foreground">Verifique o número do WhatsApp ou código e tente novamente.</p>
            </CardContent>
          </Card>
        )}

        {requests.length > 0 && !selectedRequest && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-bold text-muted-foreground">{requests.length} solicitação(ões) encontrada(s)</p>
            {requests.map(r => {
              const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
              return (
                <Card key={r.id} className="border-0 shadow-sm cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group" onClick={() => setSelectedRequest(r)}>
                  <div className={`h-1 ${r.status === 'pending' ? 'bg-yellow-400' : r.status === 'processing' ? 'bg-blue-500' : 'bg-green-500'}`} />
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm font-mono">{r.id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('pt-BR')} — {r.fullName}</p>
                    </div>
                    <Badge className={`${st.color} border-0`}>{st.label}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {requestToShow && (
          <div className="mt-6 space-y-4">
            {requests.length > 1 && <Button variant="ghost" className="text-sm gap-1" onClick={() => setSelectedRequest(null)}>← Voltar à lista</Button>}

            <Card className="border-0 shadow-sm overflow-hidden">
              <div className={`h-1 ${requestToShow.status === 'pending' ? 'bg-yellow-400' : requestToShow.status === 'processing' ? 'bg-blue-500' : 'bg-green-500'}`} />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div><p className="text-xs text-muted-foreground">Solicitação</p><p className="font-bold text-base font-mono">{requestToShow.id}</p></div>
                  <Badge className={`${(STATUS_CONFIG[requestToShow.status] || STATUS_CONFIG.pending).color} border-0`}>{(STATUS_CONFIG[requestToShow.status] || STATUS_CONFIG.pending).label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Nome Completo</p><p className="font-medium">{requestToShow.fullName}</p></div>
                  <div><p className="text-xs text-muted-foreground">CPF</p><p className="font-medium">{requestToShow.cpf}</p></div>
                  <div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{requestToShow.phone}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{requestToShow.email}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Endereço</p><p className="font-medium">{requestToShow.address}</p></div>
                  <div><p className="text-xs text-muted-foreground">CEP</p><p className="font-medium">{requestToShow.cep}</p></div>
                  <div><p className="text-xs text-muted-foreground">Cidade</p><p className="font-medium">{requestToShow.city}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Data da Solicitação</p><p className="font-medium">{new Date(requestToShow.createdAt).toLocaleDateString('pt-BR')} às {new Date(requestToShow.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary/30 to-primary/10" />
              <CardContent className="p-6">
                <p className="text-sm font-bold mb-4">Progresso</p>
                <div className="space-y-0">
                  {STEPS.map((step, i) => {
                    const current = getStepIndex(requestToShow.status);
                    const isActive = i <= current;
                    const isCurrent = i === current;
                    const config = STATUS_CONFIG[step];
                    return (
                      <div key={step} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'} ${isCurrent ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''}`}>{i + 1}</div>
                          {i < STEPS.length - 1 && <div className={`w-0.5 h-8 ${isActive && i < current ? 'bg-primary' : 'bg-muted'}`} />}
                        </div>
                        <div className="pt-1.5"><p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{config.label}</p></div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {requestToShow.status === 'completed' && requestToShow.invoiceFileUrl && (
              <Card className="border-0 shadow-sm border-l-4 border-l-green-500 overflow-hidden">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
                    <p className="font-bold text-green-700">Nota Fiscal Disponível!</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Sua nota fiscal foi emitida e está pronta para download.</p>
                  <a href={requestToShow.invoiceFileUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl h-12 font-bold shadow-lg"><Download className="h-4 w-4" /> Baixar Nota Fiscal</Button>
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <footer className="py-4 text-center mt-8 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">© 2026</span>
          <img src={logoItDigital} alt="IT Digital" className="h-5 w-auto" />
          <span className="text-xs text-muted-foreground">IT Digital. Todos os direitos reservados.</span>
        </footer>
      </div>
    </div>
  );
};

export default InvoiceTrack;
