import { useState, useRef } from 'react';
import { useTechnicians } from '@/contexts/TechnicianContext';
import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Phone, Mail, Wrench, Pencil, Trash2, Camera, FileText, Eye, Users, UserCheck, UserX } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SPECIALTY_LABELS, TECH_STATUS_LABELS } from '@/types/technician';
import { useToast } from '@/hooks/use-toast';

const statGradients = [
  'bg-gradient-to-br from-[hsl(215,40%,16%)] to-[hsl(215,35%,28%)]',
  'bg-gradient-to-br from-[hsl(152,60%,38%)] to-[hsl(152,50%,50%)]',
  'bg-gradient-to-br from-[hsl(40,95%,50%)] to-[hsl(30,90%,55%)]',
];

const Technicians = () => {
  const { technicians, addTechnician, updateTechnician, deleteTechnician } = useTechnicians();
  const { orders } = useOrders();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');
  const [specialty, setSpecialty] = useState<'hydraulic' | 'electrical' | 'both'>('both');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [documentPhoto, setDocumentPhoto] = useState('');
  const [techUsername, setTechUsername] = useState('');
  const [techPassword, setTechPassword] = useState('');
  const [viewTech, setViewTech] = useState<string | null>(null);

  const profileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName(''); setPhone(''); setEmail(''); setRg(''); setCpf('');
    setSpecialty('both'); setEditId(null); setProfilePhoto(''); setDocumentPhoto('');
    setTechUsername(''); setTechPassword('');
  };

  const handleFileUpload = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editId) {
      updateTechnician(editId, { name, phone, email, specialty, rg, cpf, profilePhoto, documentPhoto, username: techUsername, password: techPassword });
      toast({ title: 'Técnico atualizado!' });
    } else {
      addTechnician({ name, phone, email, specialty, status: 'available', rg, cpf, profilePhoto, documentPhoto, username: techUsername, password: techPassword });
      toast({ title: 'Técnico adicionado!' });
    }
    resetForm();
    setOpen(false);
  };

  const handleEdit = (id: string) => {
    const t = technicians.find(x => x.id === id);
    if (!t) return;
    setEditId(id);
    setName(t.name); setPhone(t.phone); setEmail(t.email);
    setRg(t.rg || ''); setCpf(t.cpf || ''); setSpecialty(t.specialty);
    setProfilePhoto(t.profilePhoto || ''); setDocumentPhoto(t.documentPhoto || '');
    setTechUsername(t.username || ''); setTechPassword(t.password || '');
    setOpen(true);
  };

  const techStats = (techName: string) => {
    const techOrders = orders.filter(o =>
      o.assignedTechnician?.split(',').map(n => n.trim()).includes(techName)
    );
    return {
      total: techOrders.length,
      open: techOrders.filter(o => o.status !== 'closed').length,
      closed: techOrders.filter(o => o.status === 'closed').length,
    };
  };

  const getInitials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const availableCount = technicians.filter(t => t.status === 'available').length;
  const busyCount = technicians.filter(t => t.status === 'busy').length;

  return (
    <div className="space-y-6">
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Técnico' : 'Novo Técnico'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-20 w-20 cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors" onClick={() => profileRef.current?.click()}>
                {profilePhoto ? (
                  <AvatarImage src={profilePhoto} alt="Foto de perfil" />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Camera className="h-6 w-6" />
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="text-xs text-muted-foreground">Clique para adicionar foto</span>
              <input ref={profileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload(setProfilePhoto)} />
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>RG</Label>
                <Input value={rg} onChange={e => setRg(e.target.value)} placeholder="00.000.000-0" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Select value={specialty} onValueChange={v => setSpecialty(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hydraulic">Hidráulica</SelectItem>
                  <SelectItem value="electrical">Elétrica</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Documento com Foto</Label>
              <div onClick={() => docRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary transition-colors">
                {documentPhoto ? (
                  <img src={documentPhoto} alt="Documento" className="max-h-32 rounded-lg object-contain" />
                ) : (
                  <>
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Clique para importar documento</span>
                  </>
                )}
              </div>
              <input ref={docRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload(setDocumentPhoto)} />
            </div>
            <div className="space-y-2 border-t pt-4">
              <Label className="font-semibold">Acesso ao Sistema</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Usuário</Label>
                  <Input value={techUsername} onChange={e => setTechUsername(e.target.value)} placeholder="Login do técnico" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={techPassword} onChange={e => setTechPassword(e.target.value)} placeholder="Senha" className="rounded-xl" />
                </div>
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full rounded-xl">{editId ? 'Salvar' : 'Adicionar'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: technicians.length, icon: Users, gradient: statGradients[0] },
          { label: 'Disponíveis', value: availableCount, icon: UserCheck, gradient: statGradients[1] },
          { label: 'Ocupados', value: busyCount, icon: UserX, gradient: statGradients[2] },
        ].map(({ label, value, icon: Icon, gradient }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl p-4 ${gradient}`}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-white/10 -translate-y-4 translate-x-4" />
            <Icon className="h-5 w-5 text-white/70 mb-2" />
            <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
            <p className="text-xs text-white/70 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {technicians.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Wrench className="h-10 w-10 opacity-40" />
          </div>
          <p className="text-lg font-semibold mb-1">Nenhum técnico cadastrado</p>
          <p className="text-sm mb-4">Adicione técnicos para começar</p>
          <Button onClick={() => setOpen(true)} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Novo Técnico
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setOpen(true)} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 rounded-xl shadow-md hover:shadow-lg transition-all">
              <Plus className="h-4 w-4" /> Novo Técnico
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicians.map(tech => {
              const s = techStats(tech.name);
              return (
                <Card key={tech.id} className="group border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className={`h-1 ${tech.status === 'available' ? 'bg-green-500' : tech.status === 'busy' ? 'bg-yellow-500' : 'bg-muted-foreground/30'}`} />
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                          {tech.profilePhoto ? (
                            <AvatarImage src={tech.profilePhoto} alt={tech.name} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-[hsl(270,60%,50%)] to-[hsl(280,65%,60%)] text-white font-bold text-lg">
                              {getInitials(tech.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground">{tech.name}</p>
                          <p className="text-sm text-muted-foreground">{SPECIALTY_LABELS[tech.specialty]}</p>
                        </div>
                      </div>
                      <Badge className={`${tech.status === 'available' ? 'bg-green-100 text-green-700' : tech.status === 'busy' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'} border-0`}>
                        {TECH_STATUS_LABELS[tech.status]}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1.5">
                      <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {tech.phone || '-'}</div>
                      <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {tech.email || '-'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2.5 rounded-xl bg-muted">
                        <p className="font-bold text-foreground text-lg">{s.total}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Total</p>
                      </div>
                      <div className="text-center p-2.5 rounded-xl bg-orange-50">
                        <p className="font-bold text-orange-600 text-lg">{s.open}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Em aberto</p>
                      </div>
                      <div className="text-center p-2.5 rounded-xl bg-green-50">
                        <p className="font-bold text-green-600 text-lg">{s.closed}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Encerradas</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 gap-1 rounded-xl" size="sm" onClick={() => setViewTech(tech.id)}>
                        <Eye className="h-3 w-3" /> Ver
                      </Button>
                      <Button variant="outline" className="flex-1 gap-1 rounded-xl" size="sm" onClick={() => handleEdit(tech.id)}>
                        <Pencil className="h-3 w-3" /> Editar
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="text-destructive hover:text-destructive rounded-xl"
                        onClick={() => { deleteTechnician(tech.id); toast({ title: 'Técnico removido' }); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* View Technician Dialog */}
      {(() => {
        const tech = technicians.find(t => t.id === viewTech);
        if (!tech) return null;
        const s = techStats(tech.name);
        return (
          <Dialog open={!!viewTech} onOpenChange={(v) => { if (!v) setViewTech(null); }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detalhes do Técnico</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                    {tech.profilePhoto ? (
                      <AvatarImage src={tech.profilePhoto} alt={tech.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-[hsl(270,60%,50%)] to-[hsl(280,65%,60%)] text-white text-xl font-bold">
                        {getInitials(tech.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <p className="text-lg font-bold">{tech.name}</p>
                  <Badge className={`${tech.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} border-0`}>
                    {TECH_STATUS_LABELS[tech.status]}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-muted-foreground" /> {SPECIALTY_LABELS[tech.specialty]}</div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {tech.phone || '-'}</div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {tech.email || '-'}</div>
                  {tech.cpf && <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> CPF: {tech.cpf}</div>}
                  {tech.rg && <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> RG: {tech.rg}</div>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-xl bg-muted">
                    <p className="font-bold text-foreground text-lg">{s.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-orange-50">
                    <p className="font-bold text-orange-600 text-lg">{s.open}</p>
                    <p className="text-xs text-muted-foreground">Em aberto</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-green-50">
                    <p className="font-bold text-green-600 text-lg">{s.closed}</p>
                    <p className="text-xs text-muted-foreground">Encerradas</p>
                  </div>
                </div>
                {tech.documentPhoto && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Documento com Foto</Label>
                    <img src={tech.documentPhoto} alt="Documento" className="w-full rounded-xl border object-contain max-h-80 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(tech.documentPhoto, '_blank')} />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
};

export default Technicians;
