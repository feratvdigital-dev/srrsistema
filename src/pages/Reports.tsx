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

const statGradients = [
  'bg-gradient-to-br from-[hsl(215,40%,16%)] to-[hsl(215,35%,28%)]',
  'bg-gradient-to-br from-[hsl(152,60%,38%)] to-[hsl(152,50%,50%)]',
  'bg-gradient-to-br from-[hsl(207,90%,45%)] to-[hsl(207,80%,58%)]',
  'bg-gradient-to-br from-[hsl(40,95%,50%)] to-[hsl(30,90%,55%)]',
];

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
    const total = withTime.reduce((s, o) => s + (new Date(o.closedAt!).getTime() - new Date(o.createdAt).getTime()), 0);
    return total / withTime.length / (1000 * 60 * 60);
  }, [closedOrders]);

  const statusData = [
    { name: 'Em Aberto', value: filtered.filter(o => o.status === 'open').length },
    { name: 'Orçamento', value: filtered.filter(o => o.status === 'quote').length },
    { name: 'Em Execução', value: filtered.filter(o => o.status === 'executing').length },
    { name: 'Executado', value: filtered.filter(o => o.status === 'executed').length },
    { name: 'Encerrado', value: filtered.filter(o => o.status === 'closed').length },
  ].filter(d => d.value > 0);

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    filtered.forEach(o => {
      const d = new Date(o.createdAt);
      const key = `${d.toLocaleString('pt-BR', { month: 'short' })}/${d.getFullYear().toString().slice(2)}`;
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const typeData = [
    { name: 'Hidráulica', value: filtered.filter(o => o.serviceType === 'hydraulic').length },
    { name: 'Elétrica', value: filtered.filter(o => o.serviceType === 'electrical').length },
    { name: 'Ambos', value: filtered.filter(o => o.serviceType === 'both').length },
  ].filter(d => d.value > 0);

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
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: BarChart3, label: 'Total de OS', value: filtered.length, gradient: statGradients[0] },
          { icon: CheckCircle2, label: 'Encerradas', value: closedOrders.length, gradient: statGradients[1] },
          { icon: Clock, label: 'Tempo médio', value: `${avgTime.toFixed(1)}h`, gradient: statGradients[2] },
          { icon: TrendingUp, label: 'Faturamento', value: `R$ ${totalRevenue.toFixed(0)}`, gradient: statGradients[3] },
        ].map(({ icon: Icon, label, value, gradient }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl p-4 ${gradient}`}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-white/10 -translate-y-4 translate-x-4" />
            <Icon className="h-5 w-5 text-white/70 mb-2" />
            <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
            <p className="text-xs text-white/70 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Filtros</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] rounded-xl"><SelectValue /></SelectTrigger>
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
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[160px] rounded-xl" />
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[160px] rounded-xl" />
              </>
            )}
            <Select value={techFilter} onValueChange={setTechFilter}>
              <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Todos técnicos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos técnicos</SelectItem>
                {technicians.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder="Todos tipos" /></SelectTrigger>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[
          { title: 'Distribuição por Status', content: statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          ) : null },
          { title: 'Chamados por Mês', content: monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(207, 90%, 54%)" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : null },
          { title: 'Por Tipo de Serviço', content: typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          ) : null },
          { title: 'Desempenho por Técnico', content: techData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={techData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={100} /><Tooltip /><Legend /><Bar dataKey="Total" fill="#94a3b8" radius={[0, 6, 6, 0]} /><Bar dataKey="Encerradas" fill="#10b981" radius={[0, 6, 6, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : null },
        ].map(({ title, content }) => (
          <Card key={title} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/30 to-primary/10" />
            <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
            <CardContent>
              {content || <p className="text-center text-muted-foreground py-12">Sem dados</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
