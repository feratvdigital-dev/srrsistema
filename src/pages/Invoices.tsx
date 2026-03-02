import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText, Clock, CheckCircle2, Loader2, Search, Eye, Upload, Copy, ExternalLink, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadPhotosFromFiles } from '@/utils/uploadPhoto';

interface InvoiceRequest {
  id: string; orderId: number | null; fullName: string; cpf: string; email: string;
  phone: string; address: string; cep: string; city: string; status: string;
  invoiceFileUrl: string | null; createdAt: string; completedAt: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

const mapRow = (row: any): InvoiceRequest => ({
  id: row.id, orderId: row.order_id, fullName: row.full_name, cpf: row.cpf, email: row.email,
  phone: row.phone, address: row.address, cep: row.cep, city: row.city, status: row.status,
  invoiceFileUrl: row.invoice_file_url, createdAt: row.created_at, completedAt: row.completed_at,
});

const statGradients = [
  'bg-gradient-to-br from-[hsl(215,40%,16%)] to-[hsl(215,35%,28%)]',
  'bg-gradient-to-br from-[hsl(40,95%,50%)] to-[hsl(30,90%,55%)]',
  'bg-gradient-to-br from-[hsl(207,90%,45%)] to-[hsl(207,80%,58%)]',
  'bg-gradient-to-br from-[hsl(152,60%,38%)] to-[hsl(152,50%,50%)]',
];

const Invoices = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<InvoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<InvoiceRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchRequests = useCallback(async () => {
    const { data, error } = await supabase.from('invoice_requests').select('*').order('created_at', { ascending: false });
    if (!error && data) setRequests(data.map(mapRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
    const channel = supabase.channel('invoice_requests_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_requests' }, () => fetchRequests()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRequests]);

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    const { error } = await supabase.from('invoice_requests').update(updates).eq('id', id);
    if (error) { toast({ title: 'Erro ao atualizar', variant: 'destructive' }); return; }
    toast({ title: `Status atualizado para ${STATUS_CONFIG[status]?.label || status}` });
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status, completedAt: status === 'completed' ? new Date().toISOString() : prev.completedAt } : null);
  };

  const handleUploadInvoice = async (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await uploadPhotosFromFiles(files, 'invoices');
      if (urls.length > 0) {
        const { error } = await supabase.from('invoice_requests').update({ invoice_file_url: urls[0], status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
        toast({ title: 'Nota Fiscal anexada com sucesso!' });
        if (selected?.id === id) setSelected(prev => prev ? { ...prev, invoiceFileUrl: urls[0], status: 'completed', completedAt: new Date().toISOString() } : null);
      }
    } catch (err: any) {
      toast({ title: err?.message || 'Erro ao enviar arquivo', variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?')) return;
    const { error } = await supabase.from('invoice_requests').delete().eq('id', id);
    if (error) { toast({ title: 'Erro ao excluir', variant: 'destructive' }); return; }
    toast({ title: 'Solicitação excluída com sucesso!' });
    if (selected?.id === id) setSelected(null);
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/invoice-track?id=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado!' });
  };

  let filtered = requests;
  if (statusFilter !== 'all') filtered = filtered.filter(r => r.status === statusFilter);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(r => r.id.toLowerCase().includes(s) || r.fullName.toLowerCase().includes(s) || r.cpf.includes(s) || r.email.toLowerCase().includes(s));
  }

  const stats = [
    { label: 'Total', value: requests.length, icon: FileText, gradient: statGradients[0] },
    { label: 'Pendentes', value: requests.filter(r => r.status === 'pending').length, icon: Clock, gradient: statGradients[1] },
    { label: 'Processando', value: requests.filter(r => r.status === 'processing').length, icon: Loader2, gradient: statGradients[2] },
    { label: 'Concluídas', value: requests.filter(r => r.status === 'completed').length, icon: CheckCircle2, gradient: statGradients[3] },
  ];

  return (
    <div className="space-y-6">
      {/* Quick link */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Link para o cliente solicitar NF</p>
            <p className="text-xs text-muted-foreground truncate">{window.location.origin}/invoice-request</p>
          </div>
          <Button variant="outline" className="gap-2 shrink-0 rounded-xl" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invoice-request`); toast({ title: 'Link copiado!' }); }}>
            <Link2 className="h-4 w-4" /> Copiar Link
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, gradient }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl p-4 ${gradient}`}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-white/10 -translate-y-4 translate-x-4" />
            <Icon className="h-5 w-5 text-white/70 mb-2" />
            <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
            <p className="text-xs text-white/70 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, CPF, e-mail..." className="pl-10 rounded-xl" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {[{ value: 'all', label: 'Todos' }, { value: 'pending', label: 'Pendentes' }, { value: 'processing', label: 'Processando' }, { value: 'completed', label: 'Concluídas' }].map(s => (
                <Button key={s.value} variant={statusFilter === s.value ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s.value)} className="text-xs rounded-xl">{s.label}</Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 opacity-40" />
          </div>
          <p className="text-lg font-semibold">Nenhuma solicitação de NF encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(req => {
            const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const StIcon = st.icon;
            return (
              <Card key={req.id} className="group border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className={`h-1 ${req.status === 'pending' ? 'bg-yellow-400' : req.status === 'processing' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm font-mono">{req.id}</p>
                      <p className="text-sm text-muted-foreground">{req.fullName}</p>
                    </div>
                    <Badge className={`${st.color} border-0 text-xs`}><StIcon className="h-3 w-3 mr-1" />{st.label}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>CPF: {req.cpf}</p>
                    <p>{req.city}</p>
                    <p>{new Date(req.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs rounded-xl" onClick={() => setSelected(req)}><Eye className="h-3 w-3" /> Ver</Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs rounded-xl" onClick={() => copyLink(req.id)}><Copy className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs rounded-xl text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => deleteRequest(req.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Solicitação {selected?.id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={`${(STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending).color} border-0`}>{(STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending).label}</Badge>
                <p className="text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleDateString('pt-BR')} às {new Date(selected.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2"><Label className="text-xs text-muted-foreground">Nome Completo</Label><p className="font-medium">{selected.fullName}</p></div>
                <div><Label className="text-xs text-muted-foreground">CPF</Label><p className="font-medium">{selected.cpf}</p></div>
                <div><Label className="text-xs text-muted-foreground">Telefone</Label><p className="font-medium">{selected.phone}</p></div>
                <div className="col-span-2"><Label className="text-xs text-muted-foreground">E-mail</Label><p className="font-medium">{selected.email}</p></div>
                <div className="col-span-2"><Label className="text-xs text-muted-foreground">Endereço</Label><p className="font-medium">{selected.address}</p></div>
                <div><Label className="text-xs text-muted-foreground">CEP</Label><p className="font-medium">{selected.cep}</p></div>
                <div><Label className="text-xs text-muted-foreground">Cidade</Label><p className="font-medium">{selected.city}</p></div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Alterar Status</Label>
                <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Anexar Nota Fiscal</Label>
                {selected.invoiceFileUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">NF anexada</span>
                      <a href={selected.invoiceFileUrl} target="_blank" rel="noopener noreferrer" className="ml-auto">
                        <Button size="sm" variant="outline" className="gap-1 text-xs rounded-xl"><ExternalLink className="h-3 w-3" /> Abrir</Button>
                      </a>
                    </div>
                    <label className="block">
                      <Button variant="outline" size="sm" className="gap-1 text-xs w-full rounded-xl" disabled={uploading} asChild><span><Upload className="h-3 w-3" /> {uploading ? 'Enviando...' : 'Substituir Arquivo'}</span></Button>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { handleUploadInvoice(selected.id, e.target.files); e.target.value = ''; }} disabled={uploading} />
                    </label>
                  </div>
                ) : (
                  <label className="block">
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      {uploading ? <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" /> : (
                        <><Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Clique para enviar a NF</p><p className="text-xs text-muted-foreground">PDF ou imagem</p></>
                      )}
                    </div>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { handleUploadInvoice(selected.id, e.target.files); e.target.value = ''; }} disabled={uploading} />
                  </label>
                )}
              </div>
              <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={() => copyLink(selected.id)}><Copy className="h-4 w-4" /> Copiar Link de Acompanhamento</Button>
              <Button variant="outline" className="w-full gap-2 rounded-xl text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => deleteRequest(selected.id)}><Trash2 className="h-4 w-4" /> Excluir Solicitação</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
