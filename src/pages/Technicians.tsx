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
import { Plus, Phone, Mail, Wrench, Pencil, Trash2, Camera, FileText } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SPECIALTY_LABELS, TECH_STATUS_LABELS } from '@/types/technician';
import { useToast } from '@/hooks/use-toast';

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
    setName(t.name);
    setPhone(t.phone);
    setEmail(t.email);
    setRg(t.rg || '');
    setCpf(t.cpf || '');
    setSpecialty(t.specialty);
    setProfilePhoto(t.profilePhoto || '');
    setDocumentPhoto(t.documentPhoto || '');
    setTechUsername(t.username || '');
    setTechPassword(t.password || '');
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

  return (
    <div className="space-y-6">
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Técnico' : 'Novo Técnico'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Profile Photo */}
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
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>RG</Label>
                <Input value={rg} onChange={e => setRg(e.target.value)} placeholder="00.000.000-0" />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
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

            {/* Document Photo */}
            <div className="space-y-2">
              <Label>Documento com Foto</Label>
              <div
                onClick={() => docRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary transition-colors"
              >
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

            {/* Access Credentials */}
            <div className="space-y-2 border-t pt-4">
              <Label className="font-semibold">Acesso ao Sistema</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Usuário</Label>
                  <Input value={techUsername} onChange={e => setTechUsername(e.target.value)} placeholder="Login do técnico" />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={techPassword} onChange={e => setTechPassword(e.target.value)} placeholder="Senha" />
                </div>
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full">{editId ? 'Salvar' : 'Adicionar'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {technicians.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Wrench className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg mb-4">Nenhum técnico cadastrado</p>
          <Button onClick={() => setOpen(true)} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
            <Plus className="h-4 w-4" /> Novo Técnico
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setOpen(true)} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
              <Plus className="h-4 w-4" /> Novo Técnico
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicians.map(tech => {
              const s = techStats(tech.name);
              return (
                <Card key={tech.id} className="border-0 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          {tech.profilePhoto ? (
                            <AvatarImage src={tech.profilePhoto} alt={tech.name} />
                          ) : (
                            <AvatarFallback className="bg-purple-100 text-purple-600 font-bold">
                              {getInitials(tech.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-bold">{tech.name}</p>
                          <p className="text-sm text-muted-foreground">{SPECIALTY_LABELS[tech.specialty]}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-0">
                        {TECH_STATUS_LABELS[tech.status]}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {tech.phone || '-'}</div>
                      <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {tech.email || '-'}</div>
                      {tech.cpf && <div className="flex items-center gap-2"><FileText className="h-3 w-3" /> CPF: {tech.cpf}</div>}
                      {tech.rg && <div className="flex items-center gap-2"><FileText className="h-3 w-3" /> RG: {tech.rg}</div>}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-muted">
                        <p className="font-bold text-foreground">{s.total}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-orange-50">
                        <p className="font-bold text-orange-600">{s.open}</p>
                        <p className="text-xs text-muted-foreground">Em aberto</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-green-50">
                        <p className="font-bold text-green-600">{s.closed}</p>
                        <p className="text-xs text-muted-foreground">Encerradas</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 gap-1" size="sm" onClick={() => handleEdit(tech.id)}>
                        <Pencil className="h-3 w-3" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
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
    </div>
  );
};

export default Technicians;
