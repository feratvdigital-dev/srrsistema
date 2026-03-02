import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { useTechnicians } from '@/contexts/TechnicianContext';
import { ServiceType } from '@/types/serviceOrder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Droplets, Zap, Wrench, MapPin, CheckCircle2, Navigation, User, MoreHorizontal, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const serviceOptions: { value: ServiceType; label: string; icon: React.ElementType }[] = [
  { value: 'hydraulic', label: 'Hidráulica', icon: Droplets },
  { value: 'electrical', label: 'Elétrica', icon: Zap },
  { value: 'both', label: 'Ambos', icon: Wrench },
  { value: 'other', label: 'Outros', icon: MoreHorizontal },
];

const NewOrder = () => {
  const navigate = useNavigate();
  const { addOrder } = useOrders();
  const { technicians } = useTechnicians();
  const { toast } = useToast();

  const [serviceType, setServiceType] = useState<ServiceType>('hydraulic');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [locationLoading, setLocationLoading] = useState(false);

  const toggleTechnician = (name: string) => {
    setSelectedTechnicians(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const getLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setLocationLoading(false);
          toast({ title: 'Localização capturada com sucesso!' });
        },
        (error) => {
          setLocationLoading(false);
          let msg = 'Erro ao capturar localização';
          if (error.code === 1) msg = 'Permissão de localização negada';
          else if (error.code === 2) msg = 'Localização indisponível';
          else if (error.code === 3) msg = 'Tempo esgotado ao buscar localização';
          toast({ title: msg, variant: 'destructive' });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationLoading(false);
      toast({ title: 'Geolocalização não suportada neste navegador', variant: 'destructive' });
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const order = await addOrder({
        clientName,
        clientPhone,
        clientEmail,
        serviceType,
        address,
        description,
        observation: '',
        photos: { before: [], during: [], after: [] },
        laborCost: 0,
        materialCost: 0,
        materialDescription: '',
        assignedTechnician: selectedTechnicians.join(', '),
        latitude,
        longitude,
      });
      toast({ title: `OS #${order.id} criada com sucesso!` });
      navigate(`/orders/${order.id}`);
    } catch (error) {
      console.error('Erro ao criar OS:', error);
      toast({ title: 'Erro ao criar ordem de serviço. Tente novamente.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(215,40%,16%)] to-[hsl(215,35%,28%)] p-6 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <FileText className="h-7 w-7 text-white/80" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Nova Ordem de Serviço</h1>
            <p className="text-sm text-white/60">Preencha os dados para criar uma nova OS</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Service Type */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-primary/50" />
          <CardHeader><CardTitle className="text-base">Tipo de Serviço *</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {serviceOptions.map(({ value, label, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setServiceType(value)}
                  className={`group p-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 border-2 ${
                    serviceType === value
                      ? 'bg-foreground text-background border-foreground shadow-lg scale-[1.02]'
                      : 'bg-card text-foreground border-border hover:border-primary/50 hover:shadow-md hover:scale-[1.01]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    serviceType === value ? 'bg-background/20' : 'bg-muted group-hover:bg-primary/10'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Data */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-secondary to-secondary/50" />
          <CardHeader><CardTitle className="text-base">Dados do Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Cliente *</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} required className="rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Descrição do Problema</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} required className="rounded-xl" />
            </div>
          </CardContent>
        </Card>

        {/* Technician */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[hsl(270,60%,50%)] to-[hsl(280,65%,60%)]" />
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Técnico(s) Responsável(is)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {technicians.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum técnico cadastrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {technicians.map(t => (
                  <label key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 group">
                    <Checkbox
                      checked={selectedTechnicians.includes(t.name)}
                      onCheckedChange={() => toggleTechnician(t.name)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.specialty === 'hydraulic' ? 'Hidráulica' : t.specialty === 'electrical' ? 'Elétrica' : 'Ambos'}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${t.status === 'available' ? 'bg-green-100 text-green-700 border-0' : t.status === 'busy' ? 'bg-yellow-100 text-yellow-700 border-0' : 'bg-gray-100 text-gray-500 border-0'}`}>
                      {t.status === 'available' ? 'Disponível' : t.status === 'busy' ? 'Ocupado' : 'Offline'}
                    </Badge>
                  </label>
                ))}
                {selectedTechnicians.length > 0 && (
                  <div className="mt-2 p-3 rounded-xl bg-accent/50">
                    <p className="text-xs text-muted-foreground">
                      ✅ {selectedTechnicians.length} técnico(s): <span className="font-semibold text-foreground">{selectedTechnicians.join(', ')}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[hsl(152,60%,38%)] to-[hsl(152,50%,50%)]" />
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Localização</CardTitle></CardHeader>
          <CardContent>
            {latitude && longitude ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-200">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-700">Localização capturada</p>
                  <p className="text-sm text-green-600">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(`https://maps.google.com/?q=${latitude},${longitude}`, '_blank')}
                  className="p-2.5 rounded-xl text-green-600 hover:bg-green-100 transition-colors"
                >
                  <Navigation className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={getLocation} disabled={locationLoading} className="w-full gap-2 h-12 rounded-xl">
                <MapPin className="h-4 w-4" />
                {locationLoading ? 'Capturando...' : 'Capturar Localização'}
              </Button>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={submitting} className="w-full h-14 text-base font-bold rounded-2xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl transition-all duration-300 gap-2">
          {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Criando...</> : <>Criar Ordem de Serviço <ArrowRight className="h-5 w-5" /></>}
        </Button>
      </form>
    </div>
  );
};

export default NewOrder;
