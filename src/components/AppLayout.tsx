import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, BarChart3, Users, Plus, ArrowLeft, LogOut, Inbox, MapPin, Menu, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import logo from '@/assets/logo.png';
import logoItDigital from '@/assets/logo-itdigital.png';
import { useOrders } from '@/contexts/OrderContext';
import { useMemo, useState } from 'react';
import { useTicketNotifications } from '@/hooks/useTicketNotifications';

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/tickets', label: 'Chamados', icon: Inbox },
  { to: '/orders/new', label: 'Nova OS', icon: Plus },
  { to: '/technicians', label: 'Equipe Técnica', icon: Users },
  { to: '/expenses', label: 'Despesas', icon: DollarSign },
  { to: '/reports', label: 'Relatórios', icon: BookOpen },
  { to: '/map', label: 'Mapa de OS', icon: MapPin },
];

const AppLayout = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { orders } = useOrders();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const { pendingTickets: pendingTicketsList } = useTicketNotifications();
  const [bellRead, setBellRead] = useState(false);

  const recentOrdersList = useMemo(() => orders.filter(o => {
    const created = new Date(o.createdAt).getTime();
    return Date.now() - created < 24 * 60 * 60 * 1000 && o.status === 'open';
  }), [orders]);

  const notificationCount = pendingTicketsList.length + recentOrdersList.length;
  const pendingTickets = pendingTicketsList.length;

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
              {/* Mobile hamburger menu */}
              {isDashboard && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors sm:hidden">
                      <Menu className="h-5 w-5" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0 bg-card">
                    <div className="p-4 border-b app-header">
                      <img src={logo} alt="SR Resolve" className="h-8 w-auto" />
                      <p className="text-xs opacity-70 mt-1">Gestão de Manutenção</p>
                    </div>
                    <nav className="flex flex-col py-2">
                      {menuItems.map(item => {
                        const isActive = location.pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-primary/10 text-primary border-r-2 border-primary'
                                : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                            {item.to === '/tickets' && pendingTickets > 0 && (
                              <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {pendingTickets > 9 ? '9+' : pendingTickets}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </nav>
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user}</p>
                          <p className="text-xs text-muted-foreground">Logado</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-destructive border-destructive"
                        onClick={() => { logout(); navigate('/login'); setMobileMenuOpen(false); }}
                      >
                        <LogOut className="h-4 w-4" /> Sair da Conta
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              )}

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
                  {/* Desktop nav icons - hidden on mobile */}
                  <Link to="/tickets" className="hidden sm:block">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative" title="Chamados">
                      <Inbox className="h-5 w-5" />
                      {pendingTickets > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                          {pendingTickets > 9 ? '9+' : pendingTickets}
                        </span>
                      )}
                    </button>
                  </Link>
                  <Link to="/map" className="hidden sm:block">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Mapa de OS">
                      <MapPin className="h-5 w-5" />
                    </button>
                  </Link>
                  
                  {/* Bell - always visible */}
                  <Popover onOpenChange={(open) => { if (open) setBellRead(true); }}>
                    <PopoverTrigger asChild>
                      <button className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors relative" title="Notificações">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                        {notificationCount > 0 && !bellRead && (
                          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                            {notificationCount > 9 ? '9+' : notificationCount}
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-0">
                      <div className="px-4 py-3 border-b flex items-center justify-between">
                        <p className="text-sm font-bold">Notificações</p>
                        {notificationCount > 0 && !bellRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 text-primary hover:text-primary"
                            onClick={() => setBellRead(true)}
                          >
                            Marcar como lidas
                          </Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notificationCount === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma notificação</p>
                        ) : (
                          <div className="divide-y">
                            {pendingTicketsList.map(t => (
                              <Link key={t.id} to="/tickets" className="block px-4 py-3 hover:bg-muted/50 transition-colors">
                                <p className="text-sm font-medium">📩 Novo chamado {t.id}</p>
                                <p className="text-xs text-muted-foreground">{t.name} — {t.description.substring(0, 40)}{t.description.length > 40 ? '...' : ''}</p>
                              </Link>
                            ))}
                            {recentOrdersList.map(o => (
                              <Link key={o.id} to={`/orders/${o.id}`} className="block px-4 py-3 hover:bg-muted/50 transition-colors">
                                <p className="text-sm font-medium">🔧 Nova OS #{o.id}</p>
                                <p className="text-xs text-muted-foreground">{o.clientName} — {o.address?.substring(0, 40)}</p>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Desktop-only icons */}
                  <Link to="/technicians" className="hidden sm:block">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <BookOpen className="h-5 w-5" />
                    </button>
                  </Link>
                  <Link to="/reports" className="hidden sm:block">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <BarChart3 className="h-5 w-5" />
                    </button>
                  </Link>
                  <Link to="/technicians" className="hidden sm:block">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Users className="h-5 w-5" />
                    </button>
                  </Link>
                  <Link to="/orders/new" className="hidden sm:block">
                    <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground ml-2 gap-1 font-semibold text-sm h-9 px-3">
                      <Plus className="h-4 w-4" />
                      Nova OS
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
