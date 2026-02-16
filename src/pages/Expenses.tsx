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
  id: string;
  category: string;
  description: string;
  amount: number;
  createdAt: string;
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
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Date filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const fetchExpenses = useCallback(async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setExpenses(data.map((r: any) => ({
        id: r.id,
        category: r.category,
        description: r.description,
        amount: Number(r.amount),
        createdAt: r.created_at,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExpenses();
    const channel = supabase
      .channel('expenses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchExpenses())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchExpenses]);

  const handleSubmit = async () => {
    if (!description.trim() || !amount) return;
    const { error } = await supabase.from('expenses').insert({
      category,
      description: description.trim(),
      amount: parseFloat(amount) || 0,
    });
    if (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
      return;
    }
    toast({ title: 'Despesa registrada!' });
    setDescription('');
    setAmount('');
    setCategory('food');
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta despesa?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    toast({ title: 'Despesa excluída' });
  };

  // Apply date filter
  const dateFiltered = useMemo(() => {
    if (dateFilter === 'all') return expenses;

    return expenses.filter(e => {
      const d = new Date(e.createdAt);
      if (dateFilter === 'day') {
        return d >= startOfDay(selectedDate) && d <= endOfDay(selectedDate);
      }
      if (dateFilter === 'month') {
        return d >= startOfMonth(selectedDate) && d <= endOfMonth(selectedDate);
      }
      if (dateFilter === 'year') {
        return d >= startOfYear(selectedDate) && d <= endOfYear(selectedDate);
      }
      if (dateFilter === 'custom' && dateFrom && dateTo) {
        return d >= startOfDay(dateFrom) && d <= endOfDay(dateTo);
      }
      return true;
    });
  }, [expenses, dateFilter, selectedDate, dateFrom, dateTo]);

  const filtered = filterCategory === 'all' ? dateFiltered : dateFiltered.filter(e => e.category === filterCategory);

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  // Revenue from closed orders in the same period
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

  // Group by date
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
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => {
                    const Icon = c.icon;
                    return (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4" />}
                          {c.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Almoço equipe, Gasolina carro..." />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input type="number" inputMode="numeric" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={!description.trim() || !amount}>
              Registrar Despesa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Despesas</p>
                <p className="text-xl font-bold text-red-600">R$ {totalFiltered.toFixed(2).replace('.', ',')}</p>
                <p className="text-xs text-muted-foreground">{filtered.length} registro(s)</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ganhos</p>
                <p className="text-xl font-bold text-green-600">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
                <p className="text-xs text-muted-foreground">Chamados encerrados</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro</p>
                <p className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {profit.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-muted-foreground">{getDateFilterLabel()}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${profit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} flex items-center justify-center`}>
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> Filtrar por período
          </p>
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'all', label: 'Todos' },
              { value: 'day', label: 'Dia' },
              { value: 'month', label: 'Mês' },
              { value: 'year', label: 'Ano' },
              { value: 'custom', label: 'Personalizado' },
            ] as { value: DateFilter; label: string }[]).map(f => (
              <Button
                key={f.value}
                variant={dateFilter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter(f.value)}
                className="text-xs"
              >
                {f.label}
              </Button>
            ))}
          </div>

          {dateFilter === 'day' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}

          {dateFilter === 'month' && (
            <div className="flex gap-2">
              <Select
                value={String(selectedDate.getMonth())}
                onValueChange={(v) => setSelectedDate(new Date(selectedDate.getFullYear(), parseInt(v), 1))}
              >
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={String(m.value)} className="capitalize">{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(selectedDate.getFullYear())}
                onValueChange={(v) => setSelectedDate(new Date(parseInt(v), selectedDate.getMonth(), 1))}
              >
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {dateFilter === 'year' && (
            <Select
              value={String(selectedDate.getFullYear())}
              onValueChange={(v) => setSelectedDate(new Date(parseInt(v), 0, 1))}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {dateFilter === 'custom' && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Filters + Add */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button onClick={() => setOpen(true)} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
          <Plus className="h-4 w-4" /> Nova Despesa
        </Button>
        <div className="flex gap-1 flex-wrap flex-1 justify-end">
          {[{ value: 'all', label: 'Todos' }, ...CATEGORIES].map(c => (
            <Button
              key={c.value}
              variant={filterCategory === c.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(c.value)}
              className="text-xs"
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* List grouped by date */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <DollarSign className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg mb-4">Nenhuma despesa registrada</p>
          <Button onClick={() => setOpen(true)} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
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
                    <Card key={expense.id} className="border-0 shadow-sm">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center shrink-0`}>
                          {CatIcon && <CatIcon className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{expense.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${cat.color} border-0 text-xs`}>{cat.label}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(expense.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <p className="font-bold text-foreground whitespace-nowrap">R$ {expense.amount.toFixed(2).replace('.', ',')}</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={() => handleDelete(expense.id)}>
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