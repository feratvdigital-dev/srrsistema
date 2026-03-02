import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, DollarSign, Utensils, Fuel, Package, Megaphone, MoreHorizontal, CalendarIcon, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useOrders } from '@/contexts/OrderContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Expense {
  id: string; category: string; description: string; amount: number; createdAt: string; orderId?: number | null;
}

const CATEGORIES = [
  { value: 'food', label: 'Alimentação', icon: Utensils, color: 'bg-orange-100 text-orange-700' },
  { value: 'fuel', label: 'Combustível', icon: Fuel, color: 'bg-blue-100 text-blue-700' },
  { value: 'materials', label: 'Materiais', icon: Package, color: 'bg-green-100 text-green-700' },
  { value: 'ads', label: 'Google ADS', icon: Megaphone, color: 'bg-purple-100 text-purple-700' },
  { value: 'other', label: 'Outros', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' },
];

const getCategoryConfig = (value: string) => CATEGORIES.find(c => c.value === value) || CATEGORIES[4];

type DateFilter = 'all' | 'day' | 'month' | 'year' | 'custom';

const Expenses = () => {
  const { toast } = useToast();
  const { orders } = useOrders();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const fetchExpenses = useCallback(async () => {
    const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (!error && data) setExpenses(data.map((r: any) => ({ id: r.id, category: r.category, description: r.description, amount: Number(r.amount), createdAt: r.created_at, orderId: r.order_id })));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExpenses();
    const channel = supabase.channel('expenses_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchExpenses()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchExpenses]);

  const handleSubmit = async () => {
    if (!description.trim() || !amount) return;
    const insertData: any = { category, description: description.trim(), amount: parseFloat(amount) || 0, created_at: expenseDate.toISOString() };
    if (category === 'materials' && selectedOrderId) insertData.order_id = parseInt(selectedOrderId);
    const { error } = await supabase.from('expenses').insert(insertData);
    if (error) { toast({ title: 'Erro ao salvar', variant: 'destructive' }); return; }
    toast({ title: 'Despesa registrada!' });
    setDescription(''); setAmount(''); setCategory('food'); setExpenseDate(new Date()); setSelectedOrderId(''); setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta despesa?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    toast({ title: 'Despesa excluída' });
  };

  const dateFiltered = useMemo(() => {
    if (dateFilter === 'all') return expenses;
    return expenses.filter(e => {
      const d = new Date(e.createdAt);
      if (dateFilter === 'day') return d >= startOfDay(selectedDate) && d <= endOfDay(selectedDate);
      if (dateFilter === 'month') return d >= startOfMonth(selectedDate) && d <= endOfMonth(selectedDate);
      if (dateFilter === 'year') return d >= startOfYear(selectedDate) && d <= endOfYear(selectedDate);
      if (dateFilter === 'custom' && dateFrom && dateTo) return d >= startOfDay(dateFrom) && d <= endOfDay(dateTo);
      return true;
    });
  }, [expenses, dateFilter, selectedDate, dateFrom, dateTo]);

  const filtered = filterCategory === 'all' ? dateFiltered : dateFiltered.filter(e => e.category === filterCategory);
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  const totalRevenue = useMemo(() => {
    let result = orders.filter(o => o.status === 'closed');
    if (dateFilter !== 'all') {
      result = result.filter(o => {
        const d = new Date(o.closedAt || o.createdAt);
        if (dateFilter === 'day') return d >= startOfDay(selectedDate) && d <= endOfDay(selectedDate);
        if (dateFilter === 'month') return d >= startOfMonth(selectedDate) && d <= endOfMonth(selectedDate);
        if (dateFilter === 'year') return d >= startOfYear(selectedDate) && d <= endOfYear(selectedDate);
        if (dateFilter === 'custom' && dateFrom && dateTo) return d >= startOfDay(dateFrom) && d <= endOfDay(dateTo);
        return true;
      });
    }
    return result.reduce((s, o) => s + o.laborCost + o.materialCost, 0);
  }, [orders, dateFilter, selectedDate, dateFrom, dateTo]);

  const profit = totalRevenue - totalFiltered;

  const grouped = filtered.reduce<Record<string, Expense[]>>((acc, e) => {
    const date = new Date(e.createdAt).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {});

  const getDateFilterLabel = () => {
    if (dateFilter === 'all') return 'Todos os períodos';
    if (dateFilter === 'day') return format(selectedDate, "dd/MM/yyyy");
    if (dateFilter === 'month') return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
    if (dateFilter === 'year') return format(selectedDate, "yyyy");
    if (dateFilter === 'custom' && dateFrom && dateTo) return `${format(dateFrom, "dd/MM")} a ${format(dateTo, "dd/MM/yyyy")}`;
    return 'Período personalizado';
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(selectedDate.getFullYear(), i, 1);
    return { value: i, label: format(d, 'MMMM', { locale: ptBR }) };
  });
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="space-y-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Despesa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => { const Icon = c.icon; return (<SelectItem key={c.value} value={c.value}><span className="flex items-center gap-2">{Icon && <Icon className="h-4 w-4" />}{c.label}</span></SelectItem>); })}
                </SelectContent>
              </Select>
            </div>
            {category === 'materials' && (
              <div className="space-y-2">
                <Label>Ordem de Serviço (opcional)</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione a OS..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {orders.filter(o => o.status !== 'closed').map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>OS #{o.id} - {o.clientName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2"><Label>Descrição *</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Almoço equipe, Gasolina carro..." className="rounded-xl" /></div>
            <div className="space-y-2"><Label>Valor (R$) *</Label><Input type="number" inputMode="numeric" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="rounded-xl" /></div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl")}><CalendarIcon className="mr-2 h-4 w-4" />{format(expenseDate, "dd/MM/yyyy")}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={expenseDate} onSelect={(d) => d && setExpenseDate(d)} initialFocus locale={ptBR} className={cn("p-3 pointer-events-auto")} /></PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleSubmit} className="w-full rounded-xl" disabled={!description.trim() || !amount}>Registrar Despesa</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[hsl(0,70%,50%)] to-[hsl(0,60%,60%)]">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
          <TrendingDown className="h-5 w-5 text-white/70 mb-2" />
          <p className="text-2xl font-extrabold text-white">R$ {totalFiltered.toFixed(2).replace('.', ',')}</p>
          <p className="text-xs text-white/70 font-medium">{filtered.length} despesa(s)</p>
          <p className="text-[10px] text-white/50 mt-1">Total Despesas</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[hsl(152,60%,38%)] to-[hsl(152,50%,50%)]">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
          <TrendingUp className="h-5 w-5 text-white/70 mb-2" />
          <p className="text-2xl font-extrabold text-white">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
          <p className="text-xs text-white/70 font-medium">Chamados encerrados</p>
          <p className="text-[10px] text-white/50 mt-1">Total Ganhos</p>
        </div>
        <div className={`relative overflow-hidden rounded-2xl p-5 ${profit >= 0 ? 'bg-gradient-to-br from-[hsl(210,80%,45%)] to-[hsl(220,70%,55%)]' : 'bg-gradient-to-br from-[hsl(0,70%,50%)] to-[hsl(0,60%,60%)]'}`}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
          <Wallet className="h-5 w-5 text-white/70 mb-2" />
          <p className="text-2xl font-extrabold text-white">R$ {profit.toFixed(2).replace('.', ',')}</p>
          <p className="text-xs text-white/70 font-medium">{getDateFilterLabel()}</p>
          <p className="text-[10px] text-white/50 mt-1">Lucro</p>
        </div>
      </div>

      {/* Date Filters */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Filtrar por período</p>
          <div className="flex flex-wrap gap-2">
            {([{ value: 'all', label: 'Todos' }, { value: 'day', label: 'Dia' }, { value: 'month', label: 'Mês' }, { value: 'year', label: 'Ano' }, { value: 'custom', label: 'Personalizado' }] as { value: DateFilter; label: string }[]).map(f => (
              <Button key={f.value} variant={dateFilter === f.value ? 'default' : 'outline'} size="sm" onClick={() => setDateFilter(f.value)} className="text-xs rounded-xl">{f.label}</Button>
            ))}
          </div>

          {dateFilter === 'day' && (
            <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl")}><CalendarIcon className="mr-2 h-4 w-4" />{format(selectedDate, "dd/MM/yyyy")}</Button></PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus locale={ptBR} className={cn("p-3 pointer-events-auto")} /></PopoverContent></Popover>
          )}
          {dateFilter === 'month' && (
            <div className="flex gap-2">
              <Select value={String(selectedDate.getMonth())} onValueChange={(v) => setSelectedDate(new Date(selectedDate.getFullYear(), parseInt(v), 1))}>
                <SelectTrigger className="flex-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)} className="capitalize">{m.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={String(selectedDate.getFullYear())} onValueChange={(v) => setSelectedDate(new Date(parseInt(v), selectedDate.getMonth(), 1))}>
                <SelectTrigger className="w-24 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {dateFilter === 'year' && (
            <Select value={String(selectedDate.getFullYear())} onValueChange={(v) => setSelectedDate(new Date(parseInt(v), 0, 1))}>
              <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {dateFilter === 'custom' && (
            <div className="flex gap-2">
              <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("flex-1 justify-start text-left font-normal rounded-xl", !dateFrom && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dateFrom ? format(dateFrom, "dd/MM/yyyy") : "De"}</Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus locale={ptBR} className={cn("p-3 pointer-events-auto")} /></PopoverContent></Popover>
              <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("flex-1 justify-start text-left font-normal rounded-xl", !dateTo && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dateTo ? format(dateTo, "dd/MM/yyyy") : "Até"}</Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus locale={ptBR} className={cn("p-3 pointer-events-auto")} /></PopoverContent></Popover>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Filters + Add */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button onClick={() => setOpen(true)} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 rounded-xl shadow-md hover:shadow-lg transition-all">
          <Plus className="h-4 w-4" /> Nova Despesa
        </Button>
        <div className="flex gap-1 flex-wrap flex-1 justify-end">
          {[{ value: 'all', label: 'Todos' }, ...CATEGORIES].map(c => (
            <Button key={c.value} variant={filterCategory === c.value ? 'default' : 'outline'} size="sm" onClick={() => setFilterCategory(c.value)} className="text-xs rounded-xl">{c.label}</Button>
          ))}
        </div>
      </div>

      {/* List grouped by date */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <DollarSign className="h-10 w-10 opacity-40" />
          </div>
          <p className="text-lg font-semibold mb-1">Nenhuma despesa registrada</p>
          <p className="text-sm mb-4">Adicione despesas para controle financeiro</p>
          <Button onClick={() => setOpen(true)} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Nova Despesa
          </Button>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => {
          const dayTotal = items.reduce((s, e) => s + e.amount, 0);
          return (
            <div key={date} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">{date}</p>
                <p className="text-sm font-semibold text-muted-foreground">R$ {dayTotal.toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="space-y-2">
                {items.map(expense => {
                  const cat = getCategoryConfig(expense.category);
                  const CatIcon = cat.icon;
                  return (
                    <Card key={expense.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${cat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                          {CatIcon && <CatIcon className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{expense.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${cat.color} border-0 text-xs`}>{cat.label}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(expense.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <p className="font-bold text-foreground whitespace-nowrap">R$ {expense.amount.toFixed(2).replace('.', ',')}</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0 rounded-xl" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Expenses;
