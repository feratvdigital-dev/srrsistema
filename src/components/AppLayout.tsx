import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, BarChart3, Users, Plus, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const AppLayout = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isDashboard = location.pathname === '/dashboard';
  const isSubPage = !isDashboard;

  // Determine page title
  const getTitle = () => {
    if (location.pathname === '/dashboard') return { title: 'Gestão de Manutenção', subtitle: 'Painel de controle' };
    if (location.pathname === '/orders/new') return { title: 'Nova Ordem de Serviço', subtitle: '' };
    if (location.pathname === '/technicians') return { title: 'Equipe Técnica', subtitle: 'Gerenciar técnicos' };
    if (location.pathname === '/reports') return { title: 'Relatórios', subtitle: 'Análise de desempenho' };
    if (location.pathname.startsWith('/orders/')) return { title: '', subtitle: '' }; // handled by detail page
    return { title: 'SR Resolve', subtitle: '' };
  };

  const { title, subtitle } = getTitle();
  const isOrderDetail = location.pathname.startsWith('/orders/') && location.pathname !== '/orders/new';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {!isOrderDetail && (
        <header className="app-header sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isSubPage && (
                <button onClick={() => navigate(-1)} className="p-1 hover:opacity-80">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <img src={logo} alt="SR Resolve" className="h-10 w-auto" />
              <div>
                <h1 className="font-bold text-base leading-tight">{title}</h1>
                {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDashboard && (
                <>
                  <Link to="/dashboard">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Bell className="h-5 w-5" />
                    </button>
                  </Link>
                  <Link to="/technicians">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <BookOpen className="h-5 w-5" />
                    </button>
                  </Link>
                  <Link to="/reports">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <BarChart3 className="h-5 w-5" />
                    </button>
                  </Link>
                  <Link to="/technicians">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Users className="h-5 w-5" />
                    </button>
                  </Link>
                </>
              )}
              {isDashboard ? (
                <Link to="/orders/new">
                  <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground ml-2 gap-1 font-semibold">
                    <Plus className="h-4 w-4" /> Nova OS
                  </Button>
                </Link>
              ) : (
                !isSubPage && null
              )}
              {isSubPage && location.pathname === '/technicians' && (
                <Link to="/technicians">
                  <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground ml-2 gap-1 font-semibold">
                    <Plus className="h-4 w-4" /> Novo Técnico
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      <main className={isOrderDetail ? '' : 'max-w-7xl mx-auto px-4 py-6'}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
