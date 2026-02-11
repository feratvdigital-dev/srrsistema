import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, User } from 'lucide-react';
import logo from '@/assets/logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(username, password)) {
      navigate('/dashboard');
    } else {
      setError('Usuário ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, hsl(215 40% 16%), hsl(215 40% 22%))' }}>
      <Card className="w-full max-w-sm sm:max-w-md shadow-2xl border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 sm:p-8 flex flex-col items-center">
          <img src={logo} alt="SR Resolve" className="h-16 sm:h-20 w-auto mb-3 sm:mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-primary-foreground">SR Resolve</h1>
          <p className="text-primary-foreground/80 text-xs sm:text-sm">Gestão de Manutenção</p>
        </div>
        <CardContent className="p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Digite seu usuário" className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" className="pl-10" required />
              </div>
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <Button type="submit" className="w-full h-11 sm:h-12 text-base font-semibold">Entrar</Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-xs text-white/60">© 2026 IT Digital. Todos os direitos reservados.</p>
    </div>
  );
};

export default Login;
