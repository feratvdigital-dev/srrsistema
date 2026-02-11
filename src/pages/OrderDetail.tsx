import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Camera, FileText, CheckCircle2, AlertCircle, Clock, MapPin } from 'lucide-react';
import { STATUS_LABELS, SERVICE_TYPE_LABELS, OrderStatus } from '@/types/serviceOrder';
import { useToast } from '@/hooks/use-toast';
import { generatePDF } from '@/utils/pdfGenerator';

const statusConfig: Record<OrderStatus, { class: string; icon: React.ElementType }> = {
  open: { class: 'status-badge-open', icon: AlertCircle },
  executing: { class: 'status-badge-executing', icon: Clock },
  closed: { class: 'status-badge-closed', icon: CheckCircle2 },
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrder, updateOrder } = useOrders();
  const { toast } = useToast();
  const order = getOrder(Number(id));

  const [observation, setObservation] = useState(order?.observation || '');
  const [laborCost, setLaborCost] = useState(order?.laborCost?.toString() || '');
  const [materialCost, setMaterialCost] = useState(order?.materialCost?.toString() || '');
  const [materialDescription, setMaterialDescription] = useState(order?.materialDescription || '');

  const beforeRef = useRef<HTMLInputElement>(null);
  const duringRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ordem de serviço não encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/orders')}>Voltar</Button>
      </div>
    );
  }

  const handlePhotoUpload = (phase: 'before' | 'during' | 'after', files: FileList | null) => {
    if (!files) return;
    const readers = Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(results => {
      const updated = { ...order.photos, [phase]: [...order.photos[phase], ...results] };
      updateOrder(order.id, { photos: updated });
      toast({ title: 'Foto(s) adicionada(s)!' });
    });
  };

  const handleSave = () => {
    updateOrder(order.id, {
      observation,
      laborCost: parseFloat(laborCost) || 0,
      materialCost: parseFloat(materialCost) || 0,
      materialDescription,
    });
    toast({ title: 'Ordem de serviço atualizada!' });
  };

  const handleStatusChange = (status: OrderStatus) => {
    const updates: Partial<typeof order> = {
      status,
      observation,
      laborCost: parseFloat(laborCost) || 0,
      materialCost: parseFloat(materialCost) || 0,
      materialDescription,
    };
    if (status === 'closed') {
      updates.closedAt = new Date().toISOString();
    }
    updateOrder(order.id, updates);
    toast({ title: `OS #${order.id} - ${STATUS_LABELS[status]}` });

    if (status === 'closed') {
      const updatedOrder = { ...order, ...updates };
      generatePDF(updatedOrder);
    }
  };

  const config = statusConfig[order.status];
  const StatusIcon = config.icon;

  const photoSections = [
    { key: 'before' as const, label: 'Antes', ref: beforeRef },
    { key: 'during' as const, label: 'Durante', ref: duringRef },
    { key: 'after' as const, label: 'Depois', ref: afterRef },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">OS #{order.id}</h1>
          <p className="text-muted-foreground">{order.clientName}</p>
        </div>
        <Badge variant="outline" className={`${config.class} text-sm px-3 py-1`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {STATUS_LABELS[order.status]}
        </Badge>
      </div>

      {/* Info */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Informações</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{order.clientName}</span></div>
            <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{order.clientPhone || '-'}</span></div>
            <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{SERVICE_TYPE_LABELS[order.serviceType]}</span></div>
            <div><span className="text-muted-foreground">Data:</span> <span className="font-medium">{new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Endereço:</span>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{order.address}</span>
            </div>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Descrição:</span>
            <p className="mt-1 font-medium">{order.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      {order.status !== 'closed' && (
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Registro Fotográfico</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {photoSections.map(({ key, label, ref }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-medium">{label}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} className="gap-1">
                    <Camera className="h-3 w-3" /> Adicionar
                  </Button>
                  <input
                    ref={ref}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={e => handlePhotoUpload(key, e.target.files)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {order.photos[key].map((photo, i) => (
                    <img key={i} src={photo} alt={`${label} ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
                  ))}
                  {order.photos[key].length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhuma foto adicionada</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Photos read-only for closed */}
      {order.status === 'closed' && (
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Registro Fotográfico</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {photoSections.map(({ key, label }) => (
              <div key={key}>
                <Label className="font-medium">{label}</Label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {order.photos[key].map((photo, i) => (
                    <img key={i} src={photo} alt={`${label} ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
                  ))}
                  {order.photos[key].length === 0 && <p className="text-xs text-muted-foreground">-</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Observation & Costs */}
      {order.status !== 'closed' && (
        <>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="text-base">Serviço Realizado</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                value={observation}
                onChange={e => setObservation(e.target.value)}
                placeholder="Descreva o que foi realizado..."
                rows={4}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="text-base">Custos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mão de Obra (R$)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  step="0.01"
                  min="0"
                  value={laborCost}
                  onChange={e => setLaborCost(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Materiais (R$)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  step="0.01"
                  min="0"
                  value={materialCost}
                  onChange={e => setMaterialCost(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Descreva os materiais utilizados</Label>
                <Textarea
                  value={materialDescription}
                  onChange={e => setMaterialDescription(e.target.value)}
                  placeholder="Liste os materiais utilizados..."
                  rows={3}
                />
              </div>
              <div className="p-3 rounded-lg bg-muted text-sm">
                <span className="text-muted-foreground">Total: </span>
                <span className="font-bold text-foreground text-lg">
                  R$ {((parseFloat(laborCost) || 0) + (parseFloat(materialCost) || 0)).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Costs read-only for closed */}
      {order.status === 'closed' && (
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Custos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Mão de Obra:</span><span className="font-medium">R$ {order.laborCost.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Materiais:</span><span className="font-medium">R$ {order.materialCost.toFixed(2)}</span></div>
            {order.materialDescription && <div><span className="text-muted-foreground">Descrição:</span><p className="mt-1">{order.materialDescription}</p></div>}
            <div className="flex justify-between pt-2 border-t font-bold"><span>Total:</span><span>R$ {(order.laborCost + order.materialCost).toFixed(2)}</span></div>
            {order.observation && <div className="pt-2"><span className="text-muted-foreground">Observação:</span><p className="mt-1">{order.observation}</p></div>}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {order.status === 'open' && (
          <>
            <Button onClick={handleSave} variant="outline" className="gap-2 flex-1">
              Salvar
            </Button>
            <Button onClick={() => handleStatusChange('executing')} className="gap-2 flex-1 bg-warning hover:bg-warning/90">
              <Clock className="h-4 w-4" /> Iniciar Execução
            </Button>
          </>
        )}
        {order.status === 'executing' && (
          <>
            <Button onClick={handleSave} variant="outline" className="gap-2 flex-1">
              Salvar
            </Button>
            <Button onClick={() => handleStatusChange('closed')} className="gap-2 flex-1 bg-success hover:bg-success/90">
              <CheckCircle2 className="h-4 w-4" /> Finalizar OS
            </Button>
          </>
        )}
        {order.status === 'closed' && (
          <Button onClick={() => generatePDF(order)} variant="outline" className="gap-2 flex-1">
            <FileText className="h-4 w-4" /> Gerar PDF
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
