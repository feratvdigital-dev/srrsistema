import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { ServiceType } from '@/types/serviceOrder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NewOrder = () => {
  const navigate = useNavigate();
  const { addOrder } = useOrders();
  const { toast } = useToast();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('hydraulic');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
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
        () => {
          setLocationLoading(false);
          toast({ title: 'Erro ao capturar localização', variant: 'destructive' });
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = addOrder({
      clientName,
      clientPhone,
      serviceType,
      address,
      description,
      observation: '',
      photos: { before: [], during: [], after: [] },
      laborCost: 0,
      materialCost: 0,
      materialDescription: '',
      assignedTechnician: '',
      latitude,
      longitude,
    });
    toast({ title: `OS #${order.id} criada com sucesso!` });
    navigate(`/orders/${order.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova Ordem de Serviço</h1>
        <p className="text-muted-foreground">Preencha os dados para abrir uma OS</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Dados do Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente *</Label>
                <Input id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Telefone</Label>
                <Input id="clientPhone" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço *</Label>
              <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required />
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={getLocation} disabled={locationLoading} className="gap-2">
                <MapPin className="h-4 w-4" />
                {locationLoading ? 'Capturando...' : 'Capturar Localização'}
              </Button>
              {latitude && longitude && (
                <span className="text-xs text-muted-foreground">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Tipo de Serviço</CardTitle></CardHeader>
          <CardContent>
            <RadioGroup value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)} className="flex flex-col gap-3">
              {([
                { value: 'hydraulic', label: 'Hidráulica' },
                { value: 'electrical', label: 'Elétrica' },
                { value: 'both', label: 'Hidráulica e Elétrica' },
              ] as const).map(({ value, label }) => (
                <div key={value} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <RadioGroupItem value={value} id={value} />
                  <Label htmlFor={value} className="cursor-pointer font-medium">{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Descrição do Problema</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o problema encontrado..."
              rows={4}
              required
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-base font-semibold gap-2">
          <Save className="h-5 w-5" /> Abrir Ordem de Serviço
        </Button>
      </form>
    </div>
  );
};

export default NewOrder;
