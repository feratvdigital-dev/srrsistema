import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { useTechnicians } from '@/contexts/TechnicianContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Camera, Download, ArrowLeft, MapPin, Clock, ExternalLink,
  Droplets, Zap, Wrench, Circle, Play, CheckCircle2, Lock,
  Save, Image as ImageIcon, PenTool, User, Trash2, Loader2,
  FileText, XCircle, DollarSign
} from 'lucide-react';
import { STATUS_LABELS, SERVICE_TYPE_LABELS, OrderStatus, ServiceType } from '@/types/serviceOrder';
import { useToast } from '@/hooks/use-toast';
import { generatePDF } from '@/utils/pdfGenerator';
import { uploadPhotosFromFiles } from '@/utils/uploadPhoto';

const serviceTypeIcons: Record<ServiceType, React.ElementType> = {
  hydraulic: Droplets,
  electrical: Zap,
  both: Wrench,
};

const statusConfig: Record<OrderStatus, { icon: React.ElementType; bgClass: string; textClass: string }> = {
  open: { icon: Circle, bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
  quote: { icon: FileText, bgClass: 'bg-purple-50', textClass: 'text-purple-700' },
  executing: { icon: Play, bgClass: 'bg-blue-50', textClass: 'text-blue-700' },
  executed: { icon: CheckCircle2, bgClass: 'bg-green-50', textClass: 'text-green-700' },
  closed: { icon: Lock, bgClass: 'bg-gray-100', textClass: 'text-gray-700' },
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrder, updateOrder, deleteOrder } = useOrders();
  const { technicians } = useTechnicians();
  const { toast } = useToast();
  const order = getOrder(Number(id));

  const [observation, setObservation] = useState(order?.observation || '');
  const [laborCost, setLaborCost] = useState(order?.laborCost?.toString() || '');
  const [materialCost, setMaterialCost] = useState(order?.materialCost?.toString() || '');
  const [materialDescription, setMaterialDescription] = useState(order?.materialDescription || '');
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>(
    order?.assignedTechnician ? order.assignedTechnician.split(', ').filter(Boolean) : []
  );

  const toggleTechnician = (name: string) => {
    setSelectedTechnicians(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const assignedTechnician = selectedTechnicians.join(', ');
  const [address, setAddress] = useState(order?.address || '');
  const [visitCost, setVisitCost] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [uploadingPhase, setUploadingPhase] = useState<string | null>(null);
  const [editingClosed, setEditingClosed] = useState(false);

  // No refs needed - using label approach for better mobile compatibility

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ordem de serviço não encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>Voltar</Button>
      </div>
    );
  }

  const handlePhotoUpload = async (phase: 'before' | 'during' | 'after', files: FileList | null) => {
    if (!files) return;
    setUploadingPhase(phase);
    try {
      const urls = await uploadPhotosFromFiles(files, `orders/${order.id}/${phase}`);
      const updated = { ...order.photos, [phase]: [...order.photos[phase], ...urls] };
      await updateOrder(order.id, { photos: updated });
      toast({ title: 'Foto(s) adicionada(s)!' });
    } catch {
      toast({ title: 'Erro ao enviar fotos', variant: 'destructive' });
    } finally {
      setUploadingPhase(null);
    }
  };

  const handleSave = async () => {
    await updateOrder(order.id, {
      observation,
      laborCost: parseFloat(laborCost) || 0,
      materialCost: parseFloat(materialCost) || 0,
      materialDescription,
      assignedTechnician,
      address,
    });
    toast({ title: 'Alterações salvas!' });
  };

  const handleStatusChange = async (status: OrderStatus) => {
    const updates: Partial<typeof order> = {
      status,
      observation,
      laborCost: parseFloat(laborCost) || 0,
      materialCost: parseFloat(materialCost) || 0,
      materialDescription,
      assignedTechnician,
      address,
    };
    if (status === 'executed') updates.executedAt = new Date().toISOString();
    if (status === 'closed') {
      updates.closedAt = new Date().toISOString();
    }
    await updateOrder(order.id, updates);
    toast({ title: `OS #${order.id} - ${STATUS_LABELS[status]}` });
    if (status === 'closed') generatePDF({ ...order, ...updates } as typeof order);
  };

  const config = statusConfig[order.status];
  const StatusIcon = config.icon;
  const SvcIcon = serviceTypeIcons[order.serviceType];
  const isClosed = order.status === 'closed';
  const isEditable = !isClosed || editingClosed;

  const photoSections = [
    { key: 'before' as const, label: 'ANTES', emoji: '📷' },
    { key: 'during' as const, label: 'DURANTE', emoji: '🔧' },
    { key: 'after' as const, label: 'DEPOIS', emoji: '✅' },
  ];

  const total = (parseFloat(laborCost) || 0) + (parseFloat(materialCost) || 0);

  return (
    <div>
      {/* Dark Header */}
      <header className="app-header sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-1 hover:opacity-80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-bold text-base">OS {order.id}</h1>
              <p className="text-xs opacity-70">{order.clientName}</p>
            </div>
          </div>
          <Badge variant="outline" className={`${config.bgClass} ${config.textClass} border-0`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {STATUS_LABELS[order.status]}
          </Badge>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Service Info */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <SvcIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold">{SERVICE_TYPE_LABELS[order.serviceType]}</p>
                <p className="text-sm text-muted-foreground">{order.clientPhone}</p>
              </div>
            </div>
            <div className="text-sm space-y-1 text-muted-foreground">
              {isEditable ? (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <Input value={address} onChange={e => setAddress(e.target.value)} className="h-8 text-sm" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {order.address}
                </div>
              )}
              {order.latitude && order.longitude && (
                <a
                  href={`https://maps.google.com/?q=${order.latitude},${order.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Ver no mapa
                </a>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Aberto em {new Date(order.createdAt).toLocaleDateString('pt-BR')} às{' '}
                {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Descrição</p>
              <p className="text-sm mt-1">{order.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Technician */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Técnico(s) Responsável(is)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditable ? (
              <div className="space-y-3">
                {technicians.map(t => (
                  <label key={t.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={selectedTechnicians.includes(t.name)}
                      onCheckedChange={() => toggleTechnician(t.name)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.name}</p>
                    </div>
                  </label>
                ))}
                {selectedTechnicians.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedTechnicians.length} técnico(s): {selectedTechnicians.join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="font-medium">{order.assignedTechnician || '-'}</p>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Registro Fotográfico</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {photoSections.map(({ key, label, emoji }) => (
              <div key={key}>
                <p className="text-sm font-semibold mb-2">{emoji} Fotos - {label}</p>
                <div className="flex gap-3 flex-wrap">
                  {order.photos[key].map((photo, i) => (
                    <img key={i} src={photo} alt={`${label} ${i + 1}`} className="w-32 h-32 object-cover rounded-xl border" />
                  ))}
                  {isEditable && (
                    <>
                      <label
                        htmlFor={`photo-${key}`}
                        className="w-32 h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                      >
                        {uploadingPhase === key ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                        <span className="text-xs">{uploadingPhase === key ? 'Enviando...' : 'Adicionar'}</span>
                      </label>
                      <input
                        id={`photo-${key}`}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => {
                          handlePhotoUpload(key, e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Observation */}
        {isEditable && (
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Observações do Serviço</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                value={observation}
                onChange={e => setObservation(e.target.value)}
                placeholder="Descreva o que foi realizado..."
                rows={4}
              />
            </CardContent>
          </Card>
        )}

        {/* Costs */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Custos do Serviço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isEditable ? (
              <>
                <div className="space-y-2">
                  <Label>Mão de obra (R$)</Label>
                  <Input type="number" inputMode="numeric" step="0.01" min="0" value={laborCost} onChange={e => setLaborCost(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Materiais (R$)</Label>
                  <Input type="number" inputMode="numeric" step="0.01" min="0" value={materialCost} onChange={e => setMaterialCost(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Materiais utilizados</Label>
                  <Textarea value={materialDescription} onChange={e => setMaterialDescription(e.target.value)} placeholder="Descreva os materiais utilizados..." rows={3} />
                </div>
              </>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Mão de Obra</span><span className="font-medium">R$ {order.laborCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Materiais</span><span className="font-medium">R$ {order.materialCost.toFixed(2)}</span></div>
                {order.materialDescription && <p className="text-muted-foreground text-xs">{order.materialDescription}</p>}
              </div>
            )}
            <div className="flex justify-between items-center p-4 rounded-xl bg-foreground text-background font-bold">
              <span>Total</span>
              <span className="text-lg">R$ {(isClosed ? (order.laborCost + order.materialCost) : total).toFixed(2).replace('.', ',')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3 pb-8">
          {order.status === 'open' && (
            <>
              <Button onClick={handleSave} className="w-full h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 font-semibold">
                <Save className="h-5 w-5" /> Salvar Alterações
              </Button>
              <Button onClick={() => handleStatusChange('quote')} className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white gap-2 font-semibold">
                <FileText className="h-5 w-5" /> Enviar Orçamento
              </Button>
            </>
          )}
          {order.status === 'quote' && (
            <>
              <Button onClick={handleSave} className="w-full h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 font-semibold">
                <Save className="h-5 w-5" /> Salvar Alterações
              </Button>
              <Button onClick={() => handleStatusChange('executing')} className="w-full h-12 bg-primary hover:bg-primary/90 gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" /> Cliente Aprovou - Iniciar Serviço
              </Button>
              {!showRejectForm ? (
                <Button onClick={() => setShowRejectForm(true)} variant="outline" className="w-full h-12 border-destructive text-destructive hover:bg-destructive/10 gap-2 font-semibold">
                  <XCircle className="h-5 w-5" /> Cliente Recusou Orçamento
                </Button>
              ) : (
                <Card className="border-destructive/30">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-semibold text-destructive">Orçamento Recusado</p>
                    <div className="space-y-2">
                      <Label>Valor da Visita (R$)</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        step="0.01"
                        min="0"
                        value={visitCost}
                        onChange={e => setVisitCost(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                    <Button
                      onClick={async () => {
                        const cost = parseFloat(visitCost) || 0;
                        await updateOrder(order.id, {
                          status: 'closed',
                          laborCost: cost,
                          materialCost: 0,
                          observation: observation ? `${observation}\n\nOrçamento recusado pelo cliente.` : 'Orçamento recusado pelo cliente.',
                          closedAt: new Date().toISOString(),
                        });
                        toast({ title: `OS #${order.id} encerrada - Orçamento recusado` });
                        generatePDF({ ...order, status: 'closed', laborCost: cost, materialCost: 0, closedAt: new Date().toISOString() } as typeof order);
                      }}
                      className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 font-semibold"
                    >
                      <Lock className="h-4 w-4" /> Cobrar Visita e Encerrar
                    </Button>
                    <Button variant="ghost" className="w-full text-sm" onClick={() => setShowRejectForm(false)}>
                      Cancelar
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
          {order.status === 'executing' && (
            <>
              <Button onClick={handleSave} className="w-full h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 font-semibold">
                <Save className="h-5 w-5" /> Salvar Alterações
              </Button>
              <Button onClick={() => handleStatusChange('executed')} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" /> Marcar como Executado
              </Button>
            </>
          )}
          {order.status === 'executed' && (
            <>
              <Button onClick={handleSave} className="w-full h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 font-semibold">
                <Save className="h-5 w-5" /> Salvar Alterações
              </Button>
              <Button onClick={() => handleStatusChange('closed')} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold">
                <Lock className="h-5 w-5" /> Encerrar OS
              </Button>
            </>
          )}
          {isClosed && (
            <>
              {!editingClosed ? (
                <Button onClick={() => setEditingClosed(true)} variant="outline" className="w-full h-12 gap-2 font-semibold">
                  <PenTool className="h-5 w-5" /> Editar OS
                </Button>
              ) : (
                <>
                  <Button onClick={async () => { await handleSave(); setEditingClosed(false); toast({ title: 'OS atualizada!' }); }} className="w-full h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 font-semibold">
                    <Save className="h-5 w-5" /> Salvar Alterações
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setEditingClosed(false)}>
                    Cancelar Edição
                  </Button>
                </>
              )}
              <Button onClick={() => generatePDF(order)} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold">
                <Download className="h-5 w-5" /> Ver Relatório PDF
              </Button>
              {order.clientEmail && (
                <p className="text-center text-sm text-muted-foreground">
                  ✓ Enviado para {order.clientEmail}
                </p>
              )}
              <div className="text-center text-xs text-muted-foreground space-y-1">
                <p>Iniciado em {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                {order.executedAt && <p>Executado em {new Date(order.executedAt).toLocaleDateString('pt-BR')} às {new Date(order.executedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>}
                {order.closedAt && <p>Encerrado em {new Date(order.closedAt).toLocaleDateString('pt-BR')} às {new Date(order.closedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>}
              </div>
            </>
          )}

          {/* Delete button */}
          <Button
            variant="outline"
            onClick={async () => {
              if (window.confirm(`Tem certeza que deseja excluir a OS #${order.id}?`)) {
                await deleteOrder(order.id);
                toast({ title: `OS #${order.id} excluída com sucesso` });
                navigate('/dashboard');
              }
            }}
            className="w-full h-12 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2 font-semibold"
          >
            <Trash2 className="h-5 w-5" /> Excluir Ordem de Serviço
          </Button>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-muted-foreground border-t mt-6">
          © 2026 IT Digital. Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
};

export default OrderDetail;
