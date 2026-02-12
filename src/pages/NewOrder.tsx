import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { useTechnicians } from '@/contexts/TechnicianContext';
import { ServiceType } from '@/types/serviceOrder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Droplets, Zap, Wrench, MapPin, CheckCircle2, Navigation, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const serviceOptions: { value: ServiceType; label: string; icon: React.ElementType }[] = [
  { value: 'hydraulic', label: 'Hidráulica', icon: Droplets },
  { value: 'electrical', label: 'Elétrica', icon: Zap },
  { value: 'both', label: 'Ambos', icon: Wrench },
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
  const [assignedTechnician, setAssignedTechnician] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [locationLoading, setLocationLoading] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = addOrder({
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
      assignedTechnician,
      latitude,
      longitude,
    });
    toast({ title: `OS #${order.id} criada com sucesso!` });
    navigate(`/orders/${order.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Type */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Tipo de Serviço *</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {serviceOptions.map(({ value, label, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setServiceType(value)}
                  className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2 ${
                    serviceType === value
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card text-foreground border-border hover:border-muted-foreground'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Data */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Dados do Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Cliente *</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email (para envio do relatório)</Label>
              <Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição do Problema</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} required />
            </div>
          </CardContent>
        </Card>

        {/* Technician */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Técnico Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={assignedTechnician} onValueChange={setAssignedTechnician}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar técnico" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map(t => (
                  <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                ))}
                {technicians.length === 0 && (
                  <SelectItem value="-" disabled>Nenhum técnico cadastrado</SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Localização</CardTitle></CardHeader>
          <CardContent>
            {latitude && longitude ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-700">Localização capturada</p>
                  <p className="text-sm text-green-600">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(`https://maps.google.com/?q=${latitude},${longitude}`, '_blank')}
                  className="p-2 text-green-600 hover:text-green-800"
                >
                  <Navigation className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={getLocation} disabled={locationLoading} className="w-full gap-2">
                <MapPin className="h-4 w-4" />
                {locationLoading ? 'Capturando...' : 'Capturar Localização'}
              </Button>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground">
          Criar Ordem de Serviço
        </Button>
      </form>
    </div>
  );
};

export default NewOrder;
