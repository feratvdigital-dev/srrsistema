import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { loadTickets, ClientTicket } from './ClientRequest';
import logo from '@/assets/logo.png';
import logoItDigital from '@/assets/logo-itdigital.png';

const STATUS_CONFIG: Record<ClientTicket['status'], { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  accepted: { label: 'Aceito', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-700', icon: XCircle },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  completed: { label: 'Concluído', color: 'bg-gray-100 text-gray-600', icon: CheckCircle2 },
};

const STEPS = ['pending', 'accepted', 'in_progress', 'completed'] as const;

const TrackTicket = () => {
  const [ticketCode, setTicketCode] = useState('');
  const [ticket, setTicket] = useState<ClientTicket | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ticketCode.trim();
    if (!trimmed) return;

    const tickets = loadTickets();
    const found = tickets.find(t => t.id.toLowerCase() === trimmed.toLowerCase());
    if (found) {
      setTicket(found);
      setNotFound(false);
    } else {
      setTicket(null);
      setNotFound(true);
    }
  };

  const getStepIndex = (status: ClientTicket['status']) => {
    if (status === 'rejected') return -1;
    return STEPS.indexOf(status as any);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="app-header sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <img src={logo} alt="SR Resolve" className="h-8 w-auto" />
          <div>
            <h1 className="font-bold text-sm">Acompanhar Chamado</h1>
            <p className="text-xs opacity-70">Consulte o status do seu chamado</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <Search className="h-10 w-10 mx-auto text-primary opacity-60" />
                <h2 className="text-lg font-bold">Consulte seu Chamado</h2>
                <p className="text-sm text-muted-foreground">
                  Digite o número do ticket que você recebeu ao enviar seu chamado
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={ticketCode}
                  onChange={e => setTicketCode(e.target.value)}
                  placeholder="Ex: T1234567890123"
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
              <p className="font-semibold text-destructive">Chamado não encontrado</p>
              <p className="text-sm text-muted-foreground">
                Verifique o número do ticket e tente novamente.
              </p>
            </CardContent>
          </Card>
        )}

        {ticket && (
          <div className="mt-6 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Ticket</p>
                    <p className="font-bold text-base">{ticket.id}</p>
                  </div>
                  <Badge className={`${STATUS_CONFIG[ticket.status].color} border-0`}>
                    {STATUS_CONFIG[ticket.status].label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Nome</p>
                    <p className="font-medium">{ticket.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                    <p className="font-medium">{ticket.whatsapp}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Local</p>
                    <p className="font-medium">{ticket.location}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Descrição</p>
                    <p className="font-medium">{ticket.description}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {new Date(ticket.createdAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {ticket.linkedOrderId && (
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="text-sm font-medium text-primary">
                      ✅ Ordem de Serviço #{ticket.linkedOrderId} vinculada
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress tracker */}
            {ticket.status !== 'rejected' && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm font-bold mb-4">Progresso do Chamado</p>
                  <div className="space-y-0">
                    {STEPS.map((step, i) => {
                      const current = getStepIndex(ticket.status);
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
            )}

            {ticket.status === 'rejected' && (
              <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
                <CardContent className="p-6 text-center space-y-2">
                  <XCircle className="h-10 w-10 mx-auto text-destructive" />
                  <p className="font-semibold">Chamado Rejeitado</p>
                  <p className="text-sm text-muted-foreground">
                    Infelizmente não foi possível atender este chamado. Entre em contato para mais informações.
                  </p>
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

export default TrackTicket;
