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
import {
  Camera, Download, ArrowLeft, MapPin, Clock, ExternalLink,
  Droplets, Zap, Wrench, Circle, Play, CheckCircle2, Lock, MoreHorizontal,
  Save, PenTool, User, Trash2, Loader2,
  FileText, XCircle, Hash, Phone, Mail, CalendarDays, Receipt
} from 'lucide-react';
import { STATUS_LABELS, SERVICE_TYPE_LABELS, OrderStatus, ServiceType } from '@/types/serviceOrder';
import { useToast } from '@/hooks/use-toast';
import { generatePDF } from '@/utils/pdfGenerator';
import { uploadPhotosFromFiles } from '@/utils/uploadPhoto';

const serviceTypeIcons: Record<ServiceType, React.ElementType> = {
  hydraulic: Droplets,
  electrical: Zap,
  both: Wrench,
  other: MoreHorizontal,
};

const statusConfig: Record<OrderStatus, { icon: React.ElementType; gradient: string; badge: string; glow: string }> = {
  open: { icon: Circle, gradient: 'from-yellow-400 to-amber-500', badge: 'bg-yellow-100 text-yellow-800', glow: 'shadow-yellow-200/50' },
  quote: { icon: FileText, gradient: 'from-purple-500 to-violet-600', badge: 'bg-purple-100 text-purple-800', glow: 'shadow-purple-200/50' },
  executing: { icon: Play, gradient: 'from-blue-500 to-indigo-600', badge: 'bg-blue-100 text-blue-800', glow: 'shadow-blue-200/50' },
  executed: { icon: CheckCircle2, gradient: 'from-emerald-500 to-green-600', badge: 'bg-emerald-100 text-emerald-800', glow: 'shadow-emerald-200/50' },
  closed: { icon: Lock, gradient: 'from-gray-400 to-gray-600', badge: 'bg-gray-100 text-gray-700', glow: 'shadow-gray-200/50' },
};

const statusSteps: OrderStatus[] = ['open', 'quote', 'executing', 'executed', 'closed'];

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
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="border-0 shadow-xl rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">Ordem de serviço não encontrada</p>
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Dashboard
          </Button>
        </Card>
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
    if (saving) return;
    setSaving(true);
    try {
      await updateOrder(order.id, {
        observation,
        laborCost: parseFloat(laborCost) || 0,
        materialCost: parseFloat(materialCost) || 0,
        materialDescription,
        assignedTechnician,
        address,
      });
      toast({ title: 'Alterações salvas!' });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ title: 'Erro ao salvar alterações. Tente novamente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: OrderStatus) => {
    if (changingStatus) return;
    setChangingStatus(true);
    try {
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
    } catch (error) {
      console.error('Erro ao mudar status:', error);
      toast({ title: 'Erro ao atualizar status. Tente novamente.', variant: 'destructive' });
    } finally {
      setChangingStatus(false);
    }
  };

  const config = statusConfig[order.status];
  const StatusIcon = config.icon;
  const SvcIcon = serviceTypeIcons[order.serviceType];
  const isClosed = order.status === 'closed';
  const isEditable = !isClosed || editingClosed;
  const currentStepIndex = statusSteps.indexOf(order.status);

  const photoSections = [
    { key: 'before' as const, label: 'ANTES', icon: Camera, gradient: 'from-amber-400 to-orange-500' },
    { key: 'during' as const, label: 'DURANTE', icon: Wrench, gradient: 'from-blue-400 to-indigo-500' },
    { key: 'after' as const, label: 'DEPOIS', icon: CheckCircle2, gradient: 'from-emerald-400 to-green-500' },
  ];

  const total = (parseFloat(laborCost) || 0) + (parseFloat(materialCost) || 0);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Premium Header */}
      <header className="app-header sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 opacity-60" />
                <h1 className="font-bold text-base">OS {order.id}</h1>
              </div>
              <p className="text-xs opacity-70">{order.clientName}</p>
            </div>
          </div>
          <Badge className={`${config.badge} border-0 px-3 py-1 rounded-full font-semibold text-xs`}>
            <StatusIcon className="h-3 w-3 mr-1.5" />
            {STATUS_LABELS[order.status]}
          </Badge>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Status Progress Bar */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, i) => {
                const StepIcon = statusConfig[step].icon;
                const isActive = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className={`relative flex flex-col items-center ${isCurrent ? 'scale-110' : ''} transition-transform`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCurrent ? `bg-gradient-to-br ${statusConfig[step].gradient} text-white shadow-lg ${statusConfig[step].glow}` :
                        isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <span className={`text-[10px] mt-1.5 font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-colors ${
                        i < currentStepIndex ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Client & Service Hero Card */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} text-white flex items-center justify-center shadow-lg ${config.glow} shrink-0`}>
                <SvcIcon className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg">{SERVICE_TYPE_LABELS[order.serviceType]}</h2>
                <p className="text-sm text-muted-foreground font-medium">{order.clientName}</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {order.clientPhone}
                  </span>
                  {order.clientEmail && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> {order.clientEmail}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {isEditable ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <Input value={address} onChange={e => setAddress(e.target.value)} className="h-9 text-sm rounded-xl border-muted" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">{order.address}</span>
                </div>
              )}
              {order.latitude && order.longitude && (
                <a
                  href={`https://maps.google.com/?q=${order.latitude},${order.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-full font-medium transition-colors hover:bg-primary/10"
                >
                  <ExternalLink className="h-3 w-3" /> Ver no Google Maps
                </a>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Aberto em {new Date(order.createdAt).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-dashed">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Descrição do Serviço</p>
              <p className="text-sm leading-relaxed">{order.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Technician */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              Técnico(s) Responsável(is)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {isEditable ? (
              <div className="space-y-2">
                {technicians.map(t => (
                  <label key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-muted cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all duration-200">
                    <Checkbox
                      checked={selectedTechnicians.includes(t.name)}
                      onCheckedChange={() => toggleTechnician(t.name)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.name}</p>
                    </div>
                    {selectedTechnicians.includes(t.name) && (
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">Selecionado</Badge>
                    )}
                  </label>
                ))}
                {selectedTechnicians.length > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs text-primary font-medium">
                      {selectedTechnicians.length} técnico(s) selecionado(s)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <p className="font-medium text-sm">{order.assignedTechnician || 'Nenhum técnico atribuído'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Camera className="h-4 w-4 text-primary" />
              </div>
              Registro Fotográfico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {photoSections.map(({ key, label, icon: SectionIcon, gradient }) => (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} text-white flex items-center justify-center`}>
                    <SectionIcon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm font-semibold">Fotos - {label}</p>
                  {order.photos[key].length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full ml-auto">
                      {order.photos[key].length}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-3 flex-wrap">
                  {order.photos[key].map((photo, i) => (
                    <div key={i} className="relative group/photo">
                      <img src={photo} alt={`${label} ${i + 1}`} className="w-28 h-28 object-cover rounded-xl border shadow-sm group-hover/photo:shadow-md transition-shadow" />
                    </div>
                  ))}
                  {isEditable && (
                    <>
                      <label
                        htmlFor={`photo-${key}`}
                        className="w-28 h-28 border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                      >
                        {uploadingPhase === key ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                        <span className="text-[10px] font-medium">{uploadingPhase === key ? 'Enviando...' : 'Adicionar'}</span>
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
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PenTool className="h-4 w-4 text-primary" />
                </div>
                Observações do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Textarea
                value={observation}
                onChange={e => setObservation(e.target.value)}
                placeholder="Descreva o que foi realizado..."
                rows={4}
                className="rounded-xl border-muted resize-none"
              />
            </CardContent>
          </Card>
        )}

        {/* Costs */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-primary" />
              </div>
              Custos do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {isEditable ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mão de obra (R$)</Label>
                  <Input type="number" inputMode="numeric" step="0.01" min="0" value={laborCost} onChange={e => setLaborCost(e.target.value)} placeholder="0" className="rounded-xl border-muted" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Materiais (R$)</Label>
                  <Input type="number" inputMode="numeric" step="0.01" min="0" value={materialCost} onChange={e => setMaterialCost(e.target.value)} placeholder="0" className="rounded-xl border-muted" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Materiais utilizados</Label>
                  <Textarea value={materialDescription} onChange={e => setMaterialDescription(e.target.value)} placeholder="Descreva os materiais utilizados..." rows={3} className="rounded-xl border-muted resize-none" />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                  <span className="text-sm text-muted-foreground">Mão de Obra</span>
                  <span className="font-semibold">R$ {order.laborCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                  <span className="text-sm text-muted-foreground">Materiais</span>
                  <span className="font-semibold">R$ {order.materialCost.toFixed(2)}</span>
                </div>
                {order.materialDescription && (
                  <p className="text-muted-foreground text-xs px-1">{order.materialDescription}</p>
                )}
              </div>
            )}
            <div className={`flex justify-between items-center p-5 rounded-2xl bg-gradient-to-r ${config.gradient} text-white font-bold shadow-lg ${config.glow}`}>
              <span className="text-sm uppercase tracking-wide opacity-90">Total</span>
              <span className="text-2xl">R$ {(isClosed ? (order.laborCost + order.materialCost) : total).toFixed(2).replace('.', ',')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3 pb-8">
          {order.status === 'open' && (
            <>
               <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 font-semibold shadow-sm hover:shadow-md transition-all">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
               <Button disabled={changingStatus} onClick={() => handleStatusChange('quote')} className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white gap-2 font-semibold shadow-lg shadow-purple-200/50 hover:shadow-xl transition-all">
                {changingStatus ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />} Enviar Orçamento
              </Button>
            </>
          )}
          {order.status === 'quote' && (
            <>
               <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 font-semibold shadow-sm hover:shadow-md transition-all">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button disabled={changingStatus} onClick={() => handleStatusChange('executing')} className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white gap-2 font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl transition-all">
                {changingStatus ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />} Cliente Aprovou - Iniciar Serviço
              </Button>
              {!showRejectForm ? (
                <Button onClick={() => setShowRejectForm(true)} variant="outline" className="w-full h-12 rounded-xl border-destructive text-destructive hover:bg-destructive/10 gap-2 font-semibold transition-all">
                  <XCircle className="h-5 w-5" /> Cliente Recusou Orçamento
                </Button>
              ) : (
                <Card className="border-destructive/30 rounded-2xl overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-red-400 to-rose-500" />
                  <CardContent className="p-5 space-y-3">
                    <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Orçamento Recusado
                    </p>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Valor da Visita (R$)</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        step="0.01"
                        min="0"
                        value={visitCost}
                        onChange={e => setVisitCost(e.target.value)}
                        placeholder="0,00"
                        className="rounded-xl border-muted"
                      />
                    </div>
                    <Button
                      disabled={changingStatus}
                      onClick={async () => {
                        setChangingStatus(true);
                        try {
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
                        } catch (error) {
                          console.error('Erro ao encerrar OS:', error);
                          toast({ title: 'Erro ao encerrar OS. Tente novamente.', variant: 'destructive' });
                        } finally {
                          setChangingStatus(false);
                        }
                      }}
                      className="w-full rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 font-semibold"
                    >
                      <Lock className="h-4 w-4" /> Cobrar Visita e Encerrar
                    </Button>
                    <Button variant="ghost" className="w-full text-sm rounded-xl" onClick={() => setShowRejectForm(false)}>
                      Cancelar
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
           {order.status === 'executing' && (
            <>
              <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 font-semibold shadow-sm hover:shadow-md transition-all">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button disabled={changingStatus} onClick={() => handleStatusChange('executed')} className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white gap-2 font-semibold shadow-lg shadow-emerald-200/50 hover:shadow-xl transition-all">
                {changingStatus ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />} Marcar como Executado
              </Button>
            </>
          )}
          {order.status === 'executed' && (
            <>
              <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 font-semibold shadow-sm hover:shadow-md transition-all">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button disabled={changingStatus} onClick={() => handleStatusChange('closed')} className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white gap-2 font-semibold shadow-lg shadow-emerald-200/50 hover:shadow-xl transition-all">
                {changingStatus ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />} Encerrar OS
              </Button>
            </>
          )}
          {isClosed && (
            <>
              {!editingClosed ? (
                <Button onClick={() => setEditingClosed(true)} variant="outline" className="w-full h-12 rounded-xl gap-2 font-semibold hover:shadow-md transition-all">
                  <PenTool className="h-5 w-5" /> Editar OS
                </Button>
              ) : (
                <>
                  <Button onClick={async () => { await handleSave(); setEditingClosed(false); toast({ title: 'OS atualizada!' }); }} className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 font-semibold shadow-sm hover:shadow-md transition-all">
                    <Save className="h-5 w-5" /> Salvar Alterações
                  </Button>
                  <Button variant="ghost" className="w-full rounded-xl" onClick={() => setEditingClosed(false)}>
                    Cancelar Edição
                  </Button>
                </>
              )}
              <Button onClick={() => generatePDF(order)} className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white gap-2 font-semibold shadow-lg shadow-emerald-200/50 hover:shadow-xl transition-all">
                <Download className="h-5 w-5" /> Ver Relatório PDF
              </Button>
              {order.clientEmail && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Enviado para {order.clientEmail}
                </div>
              )}
              <Card className="border-0 rounded-2xl bg-muted/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Iniciado em {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {order.executedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Executado em {new Date(order.executedAt).toLocaleDateString('pt-BR')} às {new Date(order.executedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {order.closedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" />
                      Encerrado em {new Date(order.closedAt).toLocaleDateString('pt-BR')} às {new Date(order.closedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </CardContent>
              </Card>
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
            className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2 font-semibold transition-all"
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
