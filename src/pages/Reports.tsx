import { useMemo, useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { useTechnicians } from '@/contexts/TechnicianContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BarChart3, CheckCircle2, Clock, TrendingUp, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SERVICE_TYPE_LABELS } from '@/types/serviceOrder';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6b7280', '#8b5cf6'];

const Reports = () => {
  const { orders } = useOrders();
  const { technicians } = useTechnicians();
  const [period, setPeriod] = useState('30');
  const [techFilter, setTechFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = useMemo(() => {
    let result = orders;
    const now = new Date();

    if (period !== 'custom') {
      const days = parseInt(period);
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      result = result.filter(o => new Date(o.createdAt) >= cutoff);
    } else {
      if (startDate) result = result.filter(o => new Date(o.createdAt) >= new Date(startDate));
      if (endDate) result = result.filter(o => new Date(o.createdAt) <= new Date(endDate + 'T23:59:59'));
    }
    if (techFilter !== 'all') result = result.filter(o => o.assignedTechnician === techFilter);
    if (typeFilter !== 'all') result = result.filter(o => o.serviceType === typeFilter);
    return result;
  }, [orders, period, techFilter, typeFilter, startDate, endDate]);

  const closedOrders = filtered.filter(o => o.status === 'closed');
  const totalRevenue = closedOrders.reduce((s, o) => s + o.laborCost + o.materialCost, 0);

  const avgTime = useMemo(() => {
    const withTime = closedOrders.filter(o => o.closedAt);
    if (withTime.length === 0) return 0;
    const total = withTime.reduce((s, o) => {
      return s + (new Date(o.closedAt!).getTime() - new Date(o.createdAt).getTime());
    }, 0);
    return total / withTime.length / (1000 * 60 * 60); // hours
  }, [closedOrders]);

  // Status distribution
  const statusData = [
    { name: 'Em Aberto', value: filtered.filter(o => o.status === 'open').length },
    { name: 'Em Execução', value: filtered.filter(o => o.status === 'executing').length },
    { name: 'Executado', value: filtered.filter(o => o.status === 'executed').length },
    { name: 'Encerrado', value: filtered.filter(o => o.status === 'closed').length },
  ].filter(d => d.value > 0);

  // Monthly data
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    filtered.forEach(o => {
      const d = new Date(o.createdAt);
      const key = `${d.toLocaleString('pt-BR', { month: 'short' })}/${d.getFullYear().toString().slice(2)}`;
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // Service type distribution
  const typeData = [
    { name: 'Hidráulica', value: filtered.filter(o => o.serviceType === 'hydraulic').length },
    { name: 'Elétrica', value: filtered.filter(o => o.serviceType === 'electrical').length },
    { name: 'Ambos', value: filtered.filter(o => o.serviceType === 'both').length },
  ].filter(d => d.value > 0);

  // Technician performance
  const techData = useMemo(() => {
    const techs: Record<string, { total: number; closed: number }> = {};
    filtered.forEach(o => {
      const t = o.assignedTechnician || 'Sem técnico';
      if (!techs[t]) techs[t] = { total: 0, closed: 0 };
      techs[t].total++;
      if (o.status === 'closed') techs[t].closed++;
    });
    return Object.entries(techs).map(([name, data]) => ({ name, Total: data.total, Encerradas: data.closed }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Filtros</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {period === 'custom' && (
              <>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[160px]" />
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[160px]" />
              </>
            )}
            <Select value={techFilter} onValueChange={setTechFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todos técnicos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos técnicos</SelectItem>
                {technicians.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos tipos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                <SelectItem value="hydraulic">Hidráulica</SelectItem>
                <SelectItem value="electrical">Elétrica</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BarChart3, label: 'Total de OS', value: filtered.length, bgClass: 'bg-gray-100', textClass: 'text-gray-600' },
          { icon: CheckCircle2, label: 'Encerradas', value: closedOrders.length, bgClass: 'bg-green-100', textClass: 'text-green-600' },
          { icon: Clock, label: 'Tempo médio', value: `${avgTime.toFixed(1)}h`, bgClass: 'bg-blue-100', textClass: 'text-blue-600' },
          { icon: TrendingUp, label: 'Faturamento', value: `R$ ${totalRevenue.toFixed(0)}`, bgClass: 'bg-orange-100', textClass: 'text-orange-600' },
        ].map(({ icon: Icon, label, value, bgClass, textClass }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bgClass} ${textClass} flex items-center justify-center`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Distribuição por Status</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">Sem dados</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Chamados por Mês</CardTitle></CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">Sem dados</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Por Tipo de Serviço</CardTitle></CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">Sem dados</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Desempenho por Técnico</CardTitle></CardHeader>
          <CardContent>
            {techData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={techData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Total" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Encerradas" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">Sem dados</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
