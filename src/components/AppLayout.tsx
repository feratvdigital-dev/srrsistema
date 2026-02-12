import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, BarChart3, Users, Plus, ArrowLeft, LogOut, Inbox, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import logo from '@/assets/logo.png';
import logoItDigital from '@/assets/logo-itdigital.png';
import { loadTickets } from '@/pages/ClientRequest';

const AppLayout = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isDashboard = location.pathname === '/dashboard';
  const isOrderDetail = location.pathname.startsWith('/orders/') && location.pathname !== '/orders/new';

  const getTitle = () => {
    if (location.pathname === '/dashboard') return { title: 'Gestão de Manutenção', subtitle: 'Painel de controle' };
    if (location.pathname === '/orders/new') return { title: 'Nova Ordem de Serviço', subtitle: '' };
    if (location.pathname === '/technicians') return { title: 'Equipe Técnica', subtitle: 'Gerenciar técnicos' };
    if (location.pathname === '/reports') return { title: 'Relatórios', subtitle: 'Análise de desempenho' };
    if (location.pathname === '/tickets') return { title: 'Chamados', subtitle: 'Solicitações de clientes' };
    if (location.pathname === '/map') return { title: 'Mapa', subtitle: 'Localização das OS' };
    return { title: 'SR Resolve', subtitle: '' };
  };

  const { title, subtitle } = getTitle();
  const showBack = !isDashboard && !isOrderDetail;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {!isOrderDetail && (
        <header className="app-header sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {showBack && (
                <button onClick={() => navigate(-1)} className="p-1 hover:opacity-80 shrink-0">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <img src={logo} alt="SR Resolve" className="h-8 sm:h-10 w-auto shrink-0" />
              <div className="min-w-0">
                <h1 className="font-bold text-sm sm:text-base leading-tight truncate">{title}</h1>
                {subtitle && <p className="text-xs opacity-70 truncate">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {isDashboard && (
                <>
                  <Link to="/tickets">
                    <button className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors relative" title="Chamados">
                      <Inbox className="h-4 w-4 sm:h-5 sm:w-5" />
                      {(() => {
                        const pending = loadTickets().filter(t => t.status === 'pending').length;
                        return pending > 0 ? (
                          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                            {pending > 9 ? '9+' : pending}
                          </span>
                        ) : null;
                      })()}
                    </button>
                  </Link>
                  <Link to="/map">
                    <button className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors" title="Mapa de OS">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </Link>
                  <button className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <Link to="/technicians">
                    <button className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </Link>
                  <Link to="/reports">
                    <button className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </Link>
                  <Link to="/technicians">
                    <button className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </Link>
                  <Link to="/orders/new">
                    <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground ml-1 sm:ml-2 gap-1 font-semibold text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Nova OS</span>
                    </Button>
                  </Link>
                </>
              )}

              {/* Avatar + Logout */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 sm:ml-2">
                    <Avatar className="h-8 w-8 border-2 border-white/30">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium">{user}</p>
                    <p className="text-xs text-muted-foreground">Logado</p>
                  </div>
                  <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }} className="text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Sair da Conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      <main className={`flex-1 ${isOrderDetail ? '' : 'max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6'}`}>
        <Outlet />
      </main>

      {/* Footer */}
      {!isOrderDetail && (
        <footer className="py-4 border-t bg-card flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">© 2026</span>
          <img src={logoItDigital} alt="IT Digital" className="h-5 w-auto" />
          <span className="text-xs text-muted-foreground">IT Digital. Todos os direitos reservados.</span>
        </footer>
      )}
    </div>
  );
};

export default AppLayout;
