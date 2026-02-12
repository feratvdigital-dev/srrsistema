import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, CheckCircle2, Send, MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

export interface ClientTicket {
  id: string;
  name: string;
  whatsapp: string;
  location: string;
  latitude?: number;
  longitude?: number;
  description: string;
  photos: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed';
  createdAt: string;
  linkedOrderId?: number;
}

const TICKETS_KEY = 'sr_client_tickets';

export const loadTickets = (): ClientTicket[] => {
  try {
    return JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
  } catch { return []; }
};

export const saveTickets = (tickets: ClientTicket[]) => {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
};

const ClientRequest = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const getGPS = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationLoading(false);
        toast({ title: 'Localização capturada!' });
      },
      () => {
        setLocationLoading(false);
        toast({ title: 'Erro ao capturar localização', variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const readers = Array.from(files).map(file =>
      new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      })
    );
    Promise.all(readers).then(results => setPhotos(prev => [...prev, ...results]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket: ClientTicket = {
      id: `T${Date.now()}`,
      name, whatsapp, location, latitude, longitude,
      description, photos, status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const tickets = loadTickets();
    tickets.push(ticket);
    saveTickets(tickets);
    setTicketId(ticket.id);
    setSubmitted(true);
    toast({ title: 'Chamado enviado com sucesso!' });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Chamado Enviado!</h2>
            <p className="text-muted-foreground">Seu chamado <strong>{ticketId}</strong> foi registrado. Você receberá uma mensagem no WhatsApp quando ele for aceito.</p>
            <Button onClick={() => { setSubmitted(false); setName(''); setWhatsapp(''); setLocation(''); setDescription(''); setPhotos([]); setLatitude(undefined); setLongitude(undefined); }} variant="outline" className="w-full">
              Enviar Outro Chamado
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="app-header sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <img src={logo} alt="SR Resolve" className="h-8 w-auto" />
          <div>
            <h1 className="font-bold text-sm">Abrir Chamado</h1>
            <p className="text-xs opacity-70">Solicite um serviço</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Seus Dados</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Nome Completo *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>WhatsApp *</Label>
                <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" required />
              </div>
              <div className="space-y-1">
                <Label>Local / Endereço *</Label>
                <Input value={location} onChange={e => setLocation(e.target.value)} required />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Localização GPS</CardTitle></CardHeader>
            <CardContent>
              {latitude && longitude ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-700 text-sm">Localização capturada</p>
                    <p className="text-xs text-green-600">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
                  </div>
                  <button type="button" onClick={() => window.open(`https://maps.google.com/?q=${latitude},${longitude}`, '_blank')} className="p-1 text-green-600">
                    <Navigation className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={getGPS} disabled={locationLoading} className="w-full gap-2">
                  <MapPin className="h-4 w-4" />
                  {locationLoading ? 'Capturando...' : 'Capturar Localização'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Descreva o Problema</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o problema com o máximo de detalhes..." rows={4} required />
              
              <div>
                <p className="text-sm font-medium mb-2">Fotos do Problema</p>
                <div className="flex gap-3 flex-wrap">
                  {photos.map((p, i) => (
                    <img key={i} src={p} alt={`Foto ${i + 1}`} className="w-24 h-24 object-cover rounded-xl border" />
                  ))}
                  <label htmlFor="client-photos" className="w-24 h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                    <Camera className="h-5 w-5" />
                    <span className="text-xs">Adicionar</span>
                  </label>
                  <input id="client-photos" type="file" accept="image/*" multiple className="hidden" onChange={e => { handlePhotos(e.target.files); e.target.value = ''; }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white gap-2">
            <Send className="h-5 w-5" /> Enviar Chamado
          </Button>
        </form>

        <footer className="py-4 text-center text-xs text-muted-foreground mt-4">
          © 2026 IT Digital. Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
};

export default ClientRequest;
