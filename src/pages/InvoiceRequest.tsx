import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Send, Search, FileText, PlusCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import logoItDigital from '@/assets/logo-itdigital.png';
import { supabase } from '@/integrations/supabase/client';
import nfseLogo from '@/assets/nfse-logo.png';

const InvoiceRequest = () => {
  const { toast } = useToast();
  const [view, setView] = useState<'menu' | 'form' | 'submitted'>('menu');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [cep, setCep] = useState('');
  const [city, setCity] = useState('');
  const [requestId, setRequestId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim(); const trimmedCpf = cpf.trim();
    const trimmedEmail = email.trim(); const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim(); const trimmedNumber = houseNumber.trim(); const trimmedComplement = complement.trim(); const trimmedCep = cep.trim(); const trimmedCity = city.trim();
    if (!trimmedName || trimmedName.length > 200) { toast({ title: 'Nome inválido (máx 200 caracteres)', variant: 'destructive' }); return; }
    if (!trimmedCpf || trimmedCpf.length > 20) { toast({ title: 'CPF inválido', variant: 'destructive' }); return; }
    if (!trimmedEmail || trimmedEmail.length > 255) { toast({ title: 'E-mail inválido', variant: 'destructive' }); return; }
    if (!trimmedPhone || trimmedPhone.length > 20) { toast({ title: 'Telefone inválido', variant: 'destructive' }); return; }
    if (!trimmedAddress || trimmedAddress.length > 500) { toast({ title: 'Endereço inválido (máx 500 caracteres)', variant: 'destructive' }); return; }
    if (!trimmedNumber || trimmedNumber.length > 20) { toast({ title: 'Número inválido', variant: 'destructive' }); return; }
    if (!trimmedCep || trimmedCep.length > 15) { toast({ title: 'CEP inválido', variant: 'destructive' }); return; }
    if (!trimmedCity || trimmedCity.length > 100) { toast({ title: 'Cidade inválida', variant: 'destructive' }); return; }
    const id = `NF${Date.now()}`;
    const fullAddress = `${trimmedAddress}, ${trimmedNumber}${trimmedComplement ? ` - ${trimmedComplement}` : ''}`;
    const { error } = await supabase.from('invoice_requests').insert({ id, full_name: trimmedName, cpf: trimmedCpf, email: trimmedEmail, phone: trimmedPhone, address: fullAddress, cep: trimmedCep, city: trimmedCity });
    if (error) { toast({ title: 'Erro ao enviar solicitação. Tente novamente.', variant: 'destructive' }); return; }
    setRequestId(id); setView('submitted');
    toast({ title: 'Solicitação enviada com sucesso!' });
  };

  // Tela inicial com 2 botões
  if (view === 'menu') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, hsl(215 40% 12%), hsl(215 40% 20%))' }}>
        <header className="px-6 pt-8 pb-4 flex justify-center">
          <img src={logo} alt="SR Resolve" className="h-20 w-auto drop-shadow-lg" />
        </header>

        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="max-w-sm w-full space-y-5">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-extrabold text-white">Nota Fiscal</h1>
              <p className="text-sm text-white/60">O que deseja fazer?</p>
            </div>

            <Button
              onClick={() => setView('form')}
              className="w-full h-16 text-base font-bold bg-green-600 hover:bg-green-700 text-white gap-3 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <PlusCircle className="h-6 w-6" />
              Solicitar Nota Fiscal
            </Button>

            <a href="/invoice-track" className="block">
              <Button
                className="w-full h-16 text-base font-bold bg-yellow-500 hover:bg-yellow-600 text-white gap-3 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <Search className="h-6 w-6" />
                Acompanhar Nota Fiscal
              </Button>
            </a>

            <div className="flex justify-center pt-4">
              <img src={nfseLogo} alt="NFS-e" className="h-16 w-auto opacity-80" />
            </div>
          </div>
        </div>

        <footer className="py-4 text-center flex items-center justify-center gap-2">
          <span className="text-xs text-white/40">© 2026</span>
          <img src={logoItDigital} alt="IT Digital" className="h-5 w-auto opacity-40" />
          <span className="text-xs text-white/40">IT Digital. Todos os direitos reservados.</span>
        </footer>
      </div>
    );
  }

  // Tela de sucesso
  if (view === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, hsl(215 40% 12%), hsl(215 40% 20%))' }}>
        <Card className="max-w-md w-full border-0 shadow-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-500 to-green-400" />
          <CardContent className="p-8 text-center space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-extrabold">Solicitação Enviada!</h2>
            <p className="text-muted-foreground">Sua solicitação de Nota Fiscal <strong className="text-foreground">{requestId}</strong> foi registrada. Acompanhe o status pelo link abaixo.</p>
            <a href={`/invoice-track?phone=${encodeURIComponent(phone)}`} className="block">
              <Button className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 text-white gap-2 rounded-2xl shadow-lg">
                <Search className="h-5 w-5" /> Acompanhar Nota Fiscal
              </Button>
            </a>
            <Button onClick={() => { setView('menu'); setFullName(''); setCpf(''); setEmail(''); setPhone(''); setAddress(''); setHouseNumber(''); setComplement(''); setCep(''); setCity(''); }} variant="outline" className="w-full rounded-xl">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário
  return (
    <div className="min-h-screen bg-background">
      <header className="app-header sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => setView('menu')} className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img src={logo} alt="SR Resolve" className="h-9 w-auto" />
          <div>
            <h1 className="font-bold text-sm">Solicitar Nota Fiscal</h1>
            <p className="text-xs opacity-60">Preencha seus dados</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-1 bg-gradient-to-r from-primary to-primary/50" />
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Dados para Nota Fiscal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><Label>Nome Completo *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nome completo conforme documento" required className="rounded-xl" /></div>
              <div className="space-y-1"><Label>CPF *</Label><Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" required className="rounded-xl" /></div>
              <div className="space-y-1"><Label>E-mail *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="rounded-xl" /></div>
              <div className="space-y-1"><Label>Telefone *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" required className="rounded-xl" /></div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-1 bg-gradient-to-r from-secondary to-secondary/50" />
            <CardHeader><CardTitle className="text-base">Endereço Completo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><Label>Rua / Logradouro *</Label><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, Avenida, Travessa..." required className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Número *</Label><Input value={houseNumber} onChange={e => setHouseNumber(e.target.value)} placeholder="Nº da casa" required className="rounded-xl" /></div>
                <div className="space-y-1"><Label>Complemento</Label><Input value={complement} onChange={e => setComplement(e.target.value)} placeholder="Apto, Bloco..." className="rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>CEP *</Label><Input value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" required className="rounded-xl" /></div>
                <div className="space-y-1"><Label>Cidade *</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="Sua cidade" required className="rounded-xl" /></div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-700 text-white gap-2 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <Send className="h-5 w-5" /> Enviar Solicitação
          </Button>
        </form>

        <footer className="py-4 text-center mt-4 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">© 2026</span>
          <img src={logoItDigital} alt="IT Digital" className="h-5 w-auto" />
          <span className="text-xs text-muted-foreground">IT Digital. Todos os direitos reservados.</span>
        </footer>
      </div>
    </div>
  );
};

export default InvoiceRequest;
