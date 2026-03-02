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
  id: string;
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  address: string;
  cep: string;
  city: string;
  status: string;
  invoiceFileUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'Em Processamento', color: 'bg-blue-100 text-blue-700', icon: FileText },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

const STEPS = ['pending', 'processing', 'completed'] as const;

const mapRow = (row: any): InvoiceRequest => ({
  id: row.id,
  fullName: row.full_name,
  cpf: row.cpf,
  email: row.email,
  phone: row.phone,
  address: row.address,
  cep: row.cep,
  city: row.city,
  status: row.status,
  invoiceFileUrl: row.invoice_file_url,
  createdAt: row.created_at,
  completedAt: row.completed_at,
});

const InvoiceTrack = () => {
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [request, setRequest] = useState<InvoiceRequest | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSearchValue(id);
      searchById(id);
    }
  }, [searchParams]);

  const searchById = async (id: string) => {
    const { data } = await supabase
      .from('invoice_requests')
      .select('*')
      .eq('id', id.trim())
      .maybeSingle();

    if (data) {
      setRequest(mapRow(data));
      setNotFound(false);
    } else {
      setRequest(null);
      setNotFound(true);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    await searchById(trimmed);
  };

  const getStepIndex = (status: string) => STEPS.indexOf(status as any);

  return (
    <div className="min-h-screen bg-background">
      <header className="app-header sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <img src={logo} alt="SR Resolve" className="h-8 w-auto" />
          <div>
            <h1 className="font-bold text-sm">Acompanhar Nota Fiscal</h1>
            <p className="text-xs opacity-70">Consulte o status da sua NF</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <FileText className="h-10 w-10 mx-auto text-primary opacity-60" />
                <h2 className="text-lg font-bold">Consulte sua Nota Fiscal</h2>
                <p className="text-sm text-muted-foreground">
                  Digite o código da sua solicitação
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  placeholder="Ex: NF1234567890"
                  className="flex-1"
                />
                <Button type="submit" className="bg-primary gap-1">
                  <Search className="h-4 w-4" /> Buscar
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {notFound && (
          <Card className="border-0 shadow-sm mt-4">
            <CardContent className="p-6 text-center space-y-2">
              <AlertCircle className="h-10 w-10 mx-auto text-destructive opacity-60" />
              <p className="font-semibold text-destructive">Solicitação não encontrada</p>
              <p className="text-sm text-muted-foreground">
                Verifique o código e tente novamente.
              </p>
            </CardContent>
          </Card>
        )}

        {request && (
          <div className="mt-6 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Solicitação</p>
                    <p className="font-bold text-base">{request.id}</p>
                  </div>
                  <Badge className={`${(STATUS_CONFIG[request.status] || STATUS_CONFIG.pending).color} border-0`}>
                    {(STATUS_CONFIG[request.status] || STATUS_CONFIG.pending).label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Nome Completo</p>
                    <p className="font-medium">{request.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CPF</p>
                    <p className="font-medium">{request.cpf}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium">{request.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="font-medium">{request.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Endereço</p>
                    <p className="font-medium">{request.address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CEP</p>
                    <p className="font-medium">{request.cep}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cidade</p>
                    <p className="font-medium">{request.city}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Data da Solicitação</p>
                    <p className="font-medium">
                      {new Date(request.createdAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(request.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-bold mb-4">Progresso</p>
                <div className="space-y-0">
                  {STEPS.map((step, i) => {
                    const current = getStepIndex(request.status);
                    const isActive = i <= current;
                    const isCurrent = i === current;
                    const config = STATUS_CONFIG[step];
                    return (
                      <div key={step} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                            {i + 1}
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className={`w-0.5 h-8 ${isActive && i < current ? 'bg-primary' : 'bg-muted'}`} />
                          )}
                        </div>
                        <div className="pt-1">
                          <p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {config.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Download NF */}
            {request.status === 'completed' && request.invoiceFileUrl && (
              <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-700">Nota Fiscal Disponível!</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sua nota fiscal foi emitida e está pronta para download.
                  </p>
                  <a href={request.invoiceFileUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                      <Download className="h-4 w-4" /> Baixar Nota Fiscal
                    </Button>
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
