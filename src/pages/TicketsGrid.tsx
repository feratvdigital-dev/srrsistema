import { useState, useEffect, useCallback } from 'react';
import { ClientTicket } from './ClientRequest';
import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Clock, Eye, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const STATUS_LABELS: Record<ClientTicket['status'], string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  rejected: 'Rejeitado',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
};

const STATUS_COLORS: Record<ClientTicket['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
};

const TicketsGrid = () => {
  const [tickets, setTickets] = useState<ClientTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ClientTicket | null>(null);
  const { addOrder } = useOrders();
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    const { data } = await supabase
      .from('client_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setTickets(data.map((row: any) => ({
        id: row.id,
        name: row.name,
        whatsapp: row.whatsapp,
        location: row.location,
        latitude: row.latitude,
        longitude: row.longitude,
        description: row.description,
        photos: row.photos || [],
        status: row.status,
        createdAt: row.created_at,
        linkedOrderId: row.linked_order_id,
      })));
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateTicketStatus = async (ticketId: string, status: ClientTicket['status']) => {
    const ticket = tickets.find(t => t.id === ticketId);

    if (status === 'accepted' && ticket) {
      const order = await addOrder({
        clientName: ticket.name,
        clientPhone: ticket.whatsapp,
        clientEmail: '',
        serviceType: 'both',
        address: ticket.location,
        description: ticket.description,
        observation: '',
        photos: { before: ticket.photos, during: [], after: [] },
        laborCost: 0,
        materialCost: 0,
        materialDescription: '',
        assignedTechnician: '',
      });

      // Update ticket in DB
      await supabase
        .from('client_tickets')
        .update({ status: 'accepted', linked_order_id: order.id })
        .eq('id', ticketId);

      // Refresh tickets
      fetchTickets();

      const phone = ticket.whatsapp.replace(/\D/g, '');
      const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
      const msg = encodeURIComponent(
        `Olá ${ticket.name}! ✅ Seu chamado foi aceito e a OS #${order.id} foi criada. Acompanhe o andamento do seu serviço. - SR Resolve`
      );
      window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');

      toast({ title: `Chamado aceito! OS #${order.id} criada.` });
    } else if (status === 'rejected' && ticket) {
      await supabase
        .from('client_tickets')
        .update({ status: 'rejected' })
        .eq('id', ticketId);
      fetchTickets();

      const phone = ticket.whatsapp.replace(/\D/g, '');
      const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
      const msg = encodeURIComponent(
        `Olá ${ticket.name}, infelizmente não poderemos atender seu chamado no momento. Por favor, entre em contato para mais informações. - SR Resolve`
      );
      window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');
      toast({ title: 'Chamado rejeitado.' });
    } else {
      await supabase
        .from('client_tickets')
        .update({ status })
        .eq('id', ticketId);
      fetchTickets();
      toast({ title: `Status atualizado para ${STATUS_LABELS[status]}` });
    }
  };

  const pendingCount = tickets.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Chamados de Clientes</h2>
          <p className="text-sm text-muted-foreground">{pendingCount} pendente(s)</p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p>Nenhum chamado recebido</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(ticket => (
            <Card key={ticket.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-sm">{ticket.name}</p>
                    <p className="text-xs text-muted-foreground">{ticket.id}</p>
                  </div>
                  <Badge className={`${STATUS_COLORS[ticket.status]} border-0 text-xs`}>
                    {STATUS_LABELS[ticket.status]}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {ticket.whatsapp}
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(ticket.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <MapPin className="h-3 w-3" /> {ticket.location}
                  </a>
                  {(() => {
                    const parts = ticket.location.split(',').map(s => s.trim());
                    const city = parts.length >= 2 ? parts[parts.length - 2] || parts[parts.length - 1] : '';
                    return city ? (
                      <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-bold mt-1">
                        📍 {city}
                      </Badge>
                    ) : null;
                  })()}
                  <p>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')} {new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                {ticket.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {ticket.photos.slice(0, 3).map((p, i) => (
                      <img key={i} src={p} alt="" className="w-16 h-16 rounded-lg object-cover border flex-shrink-0" />
                    ))}
                    {ticket.photos.length > 3 && (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                        +{ticket.photos.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {ticket.linkedOrderId && (
                  <p className="text-xs text-primary font-medium">OS #{ticket.linkedOrderId} vinculada</p>
                )}

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setSelectedTicket(ticket)}>
                        <Eye className="h-3 w-3" /> Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Chamado {ticket.id}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div><strong>Nome:</strong> {ticket.name}</div>
                        <div><strong>WhatsApp:</strong> {ticket.whatsapp}</div>
                        <div><strong>Local:</strong> {ticket.location}</div>
                        <div><strong>Descrição:</strong> {ticket.description}</div>
                        {ticket.photos.length > 0 && (
                          <div className="space-y-2">
                            <strong>Fotos:</strong>
                            <div className="grid grid-cols-2 gap-2">
                              {ticket.photos.map((p, i) => (
                                <img key={i} src={p} alt="" className="rounded-lg border w-full" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {ticket.status === 'pending' && (
                    <>
                      <Button size="sm" className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => updateTicketStatus(ticket.id, 'accepted')}>
                        <CheckCircle2 className="h-3 w-3" /> Aceitar
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-white" onClick={() => updateTicketStatus(ticket.id, 'rejected')}>
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketsGrid;
