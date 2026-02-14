import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, DollarSign, Utensils, Fuel, Package, Megaphone, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

const Expenses = () => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  const filtered = filterCategory === 'all' ? expenses : expenses.filter(e => e.category === filterCategory);

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  // Group by date
  const grouped = filtered.reduce<Record<string, Expense[]>>((acc, e) => {
    const date = new Date(e.createdAt).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {});

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
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <c.icon className="h-4 w-4" /> {c.label}
                      </span>
                    </SelectItem>
                  ))}
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

      {/* Summary */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Despesas</p>
              <p className="text-2xl font-bold text-foreground">R$ {totalFiltered.toFixed(2).replace('.', ',')}</p>
              <p className="text-xs text-muted-foreground">{filtered.length} registro(s)</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters + Add */}
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
                          <CatIcon className="h-5 w-5" />
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
