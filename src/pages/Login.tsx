import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, User, ArrowRight } from 'lucide-react';
import logo from '@/assets/logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Usuário ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(0 60% 15%), hsl(0 55% 22%), hsl(5 50% 28%))' }}>
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/[0.02] -translate-y-48 -translate-x-48" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/[0.03] translate-y-40 translate-x-40" />
      <div className="absolute top-1/4 right-1/4 w-40 h-40 rounded-full bg-primary/5" />

      <Card className="w-full max-w-sm sm:max-w-md shadow-2xl border-0 overflow-hidden relative z-10 backdrop-blur-sm">
        <div className="p-6 sm:p-8 flex flex-col items-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(0 60% 18%), hsl(0 55% 25%))' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
          <img src={logo} alt="SR Resolve" className="h-24 sm:h-32 w-auto mb-4 sm:mb-5 drop-shadow-lg relative z-10" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary-foreground tracking-tight relative z-10">SR Resolve</h1>
          <p className="text-primary-foreground/60 text-xs sm:text-sm relative z-10">Gestão de Manutenção</p>
        </div>
        <CardContent className="p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Digite seu usuário" className="pl-10 h-12 rounded-xl" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" className="pl-10 h-12 rounded-xl" required />
              </div>
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium text-center">{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full h-12 sm:h-14 text-base font-bold rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-2">
              Entrar <ArrowRight className="h-5 w-5" />
            </Button>
            <button type="button" className="w-full text-sm text-primary hover:underline mt-2 font-medium">Esqueci minha senha</button>
          </form>
        </CardContent>
      </Card>
      <div className="mt-6 text-center space-y-1 relative z-10">
        <p className="text-xs text-white/50">© 2025 Conceitual Pinturas. Todos os direitos reservados.</p>
        <p className="text-xs text-white/50">Pinturas e Reparos desde 2021 ©</p>
        <p className="text-xs text-white/30">
          Desenvolvido por{' '}
          <a href="https://www.instagram.com/agenciaitd/" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white underline transition-colors">
            IT Digital
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
