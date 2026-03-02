import { useState, useMemo } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { useTechnicians } from '@/contexts/TechnicianContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import {
  FileText, Circle, Play, CheckCircle2, Lock,
  Search, Droplets, Zap, Wrench, MapPin, User, Plus, MoreHorizontal,
  TrendingUp, Clock, ArrowRight, Activity
} from 'lucide-react';
import { STATUS_LABELS, SERVICE_TYPE_LABELS, OrderStatus, ServiceType } from '@/types/serviceOrder';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const statusIcons: Record<OrderStatus, { icon: React.ElementType; bgClass: string; textClass: string }> = {
  open: { icon: Circle, bgClass: 'bg-yellow-100', textClass: 'text-yellow-600' },
  quote: { icon: FileText, bgClass: 'bg-purple-100', textClass: 'text-purple-600' },
  executing: { icon: Play, bgClass: 'bg-blue-100', textClass: 'text-blue-600' },
  executed: { icon: CheckCircle2, bgClass: 'bg-green-100', textClass: 'text-green-600' },
  closed: { icon: Lock, bgClass: 'bg-gray-100', textClass: 'text-gray-600' },
};

const serviceTypeIcons: Record<ServiceType, React.ElementType> = {
  hydraulic: Droplets,
  electrical: Zap,
  both: Wrench,
  other: MoreHorizontal,
};

const statGradients = [
  'bg-gradient-to-br from-[hsl(215,40%,16%)] to-[hsl(215,35%,28%)]',
  'bg-gradient-to-br from-[hsl(40,95%,50%)] to-[hsl(30,90%,55%)]',
  'bg-gradient-to-br from-[hsl(270,60%,50%)] to-[hsl(280,65%,60%)]',
  'bg-gradient-to-br from-[hsl(207,90%,45%)] to-[hsl(207,80%,58%)]',
  'bg-gradient-to-br from-[hsl(152,60%,38%)] to-[hsl(152,50%,50%)]',
  'bg-gradient-to-br from-[hsl(215,20%,45%)] to-[hsl(215,15%,58%)]',
];

const Dashboard = () => {
  const { orders } = useOrders();
  const { technicians } = useTechnicians();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [techFilter, setTechFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<ServiceType | 'all'>('all');

  const stats = [
    { label: 'Total de OS', value: orders.length, icon: FileText },
    { label: 'Em Aberto', value: orders.filter(o => o.status === 'open').length, icon: Circle },
    { label: 'Orçamento', value: orders.filter(o => o.status === 'quote').length, icon: FileText },
    { label: 'Em Execução', value: orders.filter(o => o.status === 'executing').length, icon: Play },
    { label: 'Executado', value: orders.filter(o => o.status === 'executed').length, icon: CheckCircle2 },
    { label: 'Encerrado', value: orders.filter(o => o.status === 'closed').length, icon: Lock },
  ];

  const recentActivity = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  const activeRate = useMemo(() => {
    if (orders.length === 0) return 0;
    const active = orders.filter(o => ['open', 'executing', 'quote'].includes(o.status)).length;
    return Math.round((active / orders.length) * 100);
  }, [orders]);

  let filtered = orders;
  if (statusFilter !== 'all') filtered = filtered.filter(o => o.status === statusFilter);
  if (techFilter !== 'all') filtered = filtered.filter(o => o.assignedTechnician === techFilter);
  if (typeFilter !== 'all') filtered = filtered.filter(o => o.serviceType === typeFilter);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(o =>
      o.id.toString().includes(s) ||
      o.clientName.toLowerCase().includes(s) ||
      o.address.toLowerCase().includes(s) ||
      o.assignedTechnician.toLowerCase().includes(s)
    );
  }
  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(({ label, value, icon: Icon }, i) => (
          <button
            key={label}
            onClick={() => {
              const statusMap: Record<string, OrderStatus | 'all'> = {
                'Total de OS': 'all', 'Em Aberto': 'open', 'Orçamento': 'quote',
                'Em Execução': 'executing', 'Executado': 'executed', 'Encerrado': 'closed'
              };
              setStatusFilter(statusMap[label] || 'all');
            }}
            className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-lg ${statGradients[i]} ${
              statusFilter !== 'all' && label !== 'Total de OS' && statusFilter !== (['all', 'open', 'quote', 'executing', 'executed', 'closed'][i])
                ? 'opacity-50' : ''
            }`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
            <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full bg-white/5 translate-y-4 -translate-x-4" />
            <Icon className="h-5 w-5 text-white/70 mb-2" />
            <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
            <p className="text-xs text-white/70 font-medium mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Quick Insights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Activity className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{activeRate}% ativas</p>
              <p className="text-xs text-muted-foreground">Taxa de OS em andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <User className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{technicians.filter(t => t.status === 'available').length} disponíveis</p>
              <p className="text-xs text-muted-foreground">de {technicians.length} técnicos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{orders.filter(o => {
                const d = new Date(o.createdAt);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length} OS</p>
              <p className="text-xs text-muted-foreground">criadas este mês</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por número, cliente, endereço ou técnico..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {(['all', 'open', 'quote', 'executing', 'executed', 'closed'] as const).map(s => (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className="text-xs"
                >
                  {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <Select value={techFilter} onValueChange={setTechFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos técnicos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos técnicos</SelectItem>
                {technicians.map(t => (
                  <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              {(['all', 'hydraulic', 'electrical', 'both', 'other'] as const).map(t => {
                const Icon = t === 'all' ? Wrench : serviceTypeIcons[t];
                return (
                  <Button
                    key={t}
                    variant={typeFilter === t ? 'default' : 'outline'}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setTypeFilter(t)}
                    title={t === 'all' ? 'Todos' : SERVICE_TYPE_LABELS[t]}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid + Activity Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Orders */}
        <div className="lg:col-span-3">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg mb-4">Nenhuma ordem de serviço encontrada</p>
              <Link to="/orders/new">
                <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
                  <Plus className="h-4 w-4" /> Criar Nova OS
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {sorted.map(order => {
                const st = statusIcons[order.status];
                const StIcon = st.icon;
                const SvcIcon = serviceTypeIcons[order.serviceType];
                return (
                  <Link key={order.id} to={`/orders/${order.id}`}>
                    <Card className="group border-0 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full relative overflow-hidden">
                      {/* Status indicator line */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        order.status === 'open' ? 'bg-yellow-400' :
                        order.status === 'quote' ? 'bg-purple-500' :
                        order.status === 'executing' ? 'bg-primary' :
                        order.status === 'executed' ? 'bg-green-500' :
                        'bg-muted-foreground/30'
                      }`} />
                      <CardContent className="p-4 pt-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-xl ${st.bgClass} ${st.textClass} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                              <SvcIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-lg leading-tight">#{order.id}</p>
                              <p className="text-sm text-muted-foreground">{order.clientName}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`${st.bgClass} ${st.textClass} border-0 text-xs shrink-0`}>
                            <StIcon className="h-3 w-3 mr-1" />
                            {STATUS_LABELS[order.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground/80 line-clamp-2">{order.description}</p>
                        <div className="text-xs text-muted-foreground space-y-1.5">
                          {order.address && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{order.address}</span>
                            </div>
                          )}
                          {order.assignedTechnician && (
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 shrink-0" />
                              <span>{order.assignedTechnician}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-border">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm sticky top-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Atividade Recente</h3>
              </div>
              <div className="space-y-1">
                {recentActivity.map((order, i) => {
                  const st = statusIcons[order.status];
                  const StIcon = st.icon;
                  return (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <div className="relative mt-0.5">
                        <div className={`w-8 h-8 rounded-lg ${st.bgClass} ${st.textClass} flex items-center justify-center`}>
                          <StIcon className="h-3.5 w-3.5" />
                        </div>
                        {i < recentActivity.length - 1 && (
                          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-4 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">OS #{order.id}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.clientName}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </Link>
                  );
                })}
                {recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
