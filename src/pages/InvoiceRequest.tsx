import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Send, Search, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import logoItDigital from '@/assets/logo-itdigital.png';
import { supabase } from '@/integrations/supabase/client';

const InvoiceRequest = () => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cep, setCep] = useState('');
  const [city, setCity] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedCpf = cpf.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    const trimmedCep = cep.trim();
    const trimmedCity = city.trim();

    if (!trimmedName || trimmedName.length > 200) {
      toast({ title: 'Nome inválido (máx 200 caracteres)', variant: 'destructive' });
      return;
    }
    if (!trimmedCpf || trimmedCpf.length > 20) {
      toast({ title: 'CPF inválido', variant: 'destructive' });
      return;
    }
    if (!trimmedEmail || trimmedEmail.length > 255) {
      toast({ title: 'E-mail inválido', variant: 'destructive' });
      return;
    }
    if (!trimmedPhone || trimmedPhone.length > 20) {
      toast({ title: 'Telefone inválido', variant: 'destructive' });
      return;
    }
    if (!trimmedAddress || trimmedAddress.length > 500) {
      toast({ title: 'Endereço inválido (máx 500 caracteres)', variant: 'destructive' });
      return;
    }
    if (!trimmedCep || trimmedCep.length > 15) {
      toast({ title: 'CEP inválido', variant: 'destructive' });
      return;
    }
    if (!trimmedCity || trimmedCity.length > 100) {
      toast({ title: 'Cidade inválida', variant: 'destructive' });
      return;
    }

    const id = `NF${Date.now()}`;
    const { error } = await supabase
      .from('invoice_requests')
      .insert({
        id,
        full_name: trimmedName,
        cpf: trimmedCpf,
        email: trimmedEmail,
        phone: trimmedPhone,
        address: trimmedAddress,
        cep: trimmedCep,
        city: trimmedCity,
      });

    if (error) {
      toast({ title: 'Erro ao enviar solicitação. Tente novamente.', variant: 'destructive' });
      return;
    }
    setRequestId(id);
    setSubmitted(true);
    toast({ title: 'Solicitação enviada com sucesso!' });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Solicitação Enviada!</h2>
            <p className="text-muted-foreground">
              Sua solicitação de Nota Fiscal <strong>{requestId}</strong> foi registrada. Acompanhe o status pelo link abaixo.
            </p>
            <a href={`/invoice-track?id=${encodeURIComponent(requestId)}`} className="block">
              <Button className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white gap-2">
                <Search className="h-5 w-5" /> Acompanhar Nota Fiscal
              </Button>
            </a>
            <Button
              onClick={() => {
                setSubmitted(false);
                setFullName(''); setCpf(''); setEmail(''); setPhone('');
                setAddress(''); setCep(''); setCity('');
              }}
              variant="outline"
              className="w-full"
            >
              Enviar Outra Solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="app-header sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <img src={logo} alt="SR Resolve" className="h-8 w-auto" />
          <div>
            <h1 className="font-bold text-sm">Solicitar Nota Fiscal</h1>
            <p className="text-xs opacity-70">Preencha seus dados</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Dados para Nota Fiscal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Nome Completo *</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nome completo conforme documento" required />
              </div>
              <div className="space-y-1">
                <Label>CPF *</Label>
                <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" required />
              </div>
              <div className="space-y-1">
                <Label>E-mail *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <div className="space-y-1">
                <Label>Telefone *</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" required />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Endereço Completo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Endereço *</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, complemento, bairro" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>CEP *</Label>
                  <Input value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" required />
                </div>
                <div className="space-y-1">
                  <Label>Cidade *</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Sua cidade" required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white gap-2">
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
