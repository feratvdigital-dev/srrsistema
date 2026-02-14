import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, CheckCircle2, Search, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { uploadPhotosFromFiles } from '@/utils/uploadPhoto';

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

export const loadTickets = async (): Promise<ClientTicket[]> => {
  const { data } = await supabase
    .from('client_tickets')
    .select('*')
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map((row: any) => ({
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
  }));
};

const ClientRequest = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await uploadPhotosFromFiles(files, 'tickets');
      setPhotos(prev => [...prev, ...urls]);
    } catch {
      toast({ title: 'Erro ao enviar fotos', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `T${Date.now()}`;
    const { error } = await supabase
      .from('client_tickets')
      .insert({
        id,
        name,
        whatsapp,
        location,
        description,
        photos,
      });
    if (error) {
      toast({ title: 'Erro ao enviar chamado', variant: 'destructive' });
      return;
    }
    setTicketId(id);
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
            <a href={`/track?whatsapp=${encodeURIComponent(whatsapp)}`} className="block">
              <Button className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white gap-2">
                <Search className="h-5 w-5" /> Acompanhe seu Chamado
              </Button>
            </a>
            <Button onClick={() => { setSubmitted(false); setName(''); setWhatsapp(''); setLocation(''); setDescription(''); setPhotos([]); }} variant="outline" className="w-full">
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
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                    <span className="text-xs">{uploading ? 'Enviando...' : 'Adicionar'}</span>
                  </label>
                  <input id="client-photos" type="file" accept="image/*" multiple className="hidden" onChange={e => { handlePhotos(e.target.files); e.target.value = ''; }} disabled={uploading} />
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
