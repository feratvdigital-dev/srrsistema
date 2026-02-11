import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { useTechnicians } from '@/contexts/TechnicianContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import {
  FileText, Circle, Play, CheckCircle2, Lock, DollarSign,
  Search, Droplets, Zap, Wrench, MapPin, User, Plus
} from 'lucide-react';
import { STATUS_LABELS, SERVICE_TYPE_LABELS, OrderStatus, ServiceType } from '@/types/serviceOrder';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const statusIcons: Record<OrderStatus, { icon: React.ElementType; bgClass: string; textClass: string }> = {
  open: { icon: Circle, bgClass: 'bg-yellow-100', textClass: 'text-yellow-600' },
  executing: { icon: Play, bgClass: 'bg-blue-100', textClass: 'text-blue-600' },
  executed: { icon: CheckCircle2, bgClass: 'bg-green-100', textClass: 'text-green-600' },
  closed: { icon: Lock, bgClass: 'bg-gray-100', textClass: 'text-gray-600' },
};

const serviceTypeIcons: Record<ServiceType, React.ElementType> = {
  hydraulic: Droplets,
  electrical: Zap,
  both: Wrench,
};

const Dashboard = () => {
  const { orders } = useOrders();
  const { technicians } = useTechnicians();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [techFilter, setTechFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<ServiceType | 'all'>('all');

  const totalRevenue = orders
    .filter(o => o.status === 'closed')
    .reduce((sum, o) => sum + o.laborCost + o.materialCost, 0);

  const stats = [
    { label: 'Total de OS', value: orders.length, icon: FileText, bgClass: 'bg-gray-100', textClass: 'text-gray-600' },
    { label: 'Em Aberto', value: orders.filter(o => o.status === 'open').length, icon: Circle, bgClass: 'bg-yellow-100', textClass: 'text-yellow-600' },
    { label: 'Em Execução', value: orders.filter(o => o.status === 'executing').length, icon: Play, bgClass: 'bg-blue-100', textClass: 'text-blue-600' },
    { label: 'Executado', value: orders.filter(o => o.status === 'executed').length, icon: CheckCircle2, bgClass: 'bg-green-100', textClass: 'text-green-600' },
    { label: 'Encerrado', value: orders.filter(o => o.status === 'closed').length, icon: Lock, bgClass: 'bg-gray-100', textClass: 'text-gray-500' },
    { label: 'Faturamento', value: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, icon: DollarSign, bgClass: 'bg-orange-100', textClass: 'text-orange-600' },
  ];

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
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(({ label, value, icon: Icon, bgClass, textClass }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-xl ${bgClass} ${textClass} flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
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
              {(['all', 'open', 'executing', 'executed', 'closed'] as const).map(s => (
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
              {(['all', 'hydraulic', 'electrical', 'both'] as const).map(t => {
                const Icon = t === 'all' ? Wrench : serviceTypeIcons[t];
                return (
                  <Button
                    key={t}
                    variant={typeFilter === t ? 'default' : 'outline'}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setTypeFilter(t)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(order => {
            const st = statusIcons[order.status];
            const StIcon = st.icon;
            const SvcIcon = serviceTypeIcons[order.serviceType];
            return (
              <Link key={order.id} to={`/orders/${order.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${st.bgClass} ${st.textClass} flex items-center justify-center`}>
                          <SvcIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">OS {order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.clientName}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${st.bgClass} ${st.textClass} border-0 text-xs`}>
                        <StIcon className="h-3 w-3 mr-1" />
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-primary font-medium">{order.description}</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {order.address}
                      </div>
                      {order.assignedTechnician && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {order.assignedTechnician}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
