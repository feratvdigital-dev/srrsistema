import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, AlertCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { STATUS_LABELS, SERVICE_TYPE_LABELS, OrderStatus } from '@/types/serviceOrder';
import { useState } from 'react';

const statusConfig: Record<OrderStatus, { class: string; icon: React.ElementType }> = {
  open: { class: 'status-badge-open', icon: AlertCircle },
  executing: { class: 'status-badge-executing', icon: Clock },
  closed: { class: 'status-badge-closed', icon: CheckCircle2 },
};

const OrderList = () => {
  const { orders } = useOrders();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ordens de Serviço</h1>
          <p className="text-muted-foreground">{sorted.length} ordem(ns)</p>
        </div>
        <Link to="/orders/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nova OS
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'open', 'executing', 'closed'] as const).map(status => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'Todos' : STATUS_LABELS[status]}
          </Button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma ordem de serviço encontrada
            </CardContent>
          </Card>
        ) : (
          sorted.map(order => {
            const config = statusConfig[order.status];
            const StatusIcon = config.icon;
            return (
              <Link key={order.id} to={`/orders/${order.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[50px]">
                        <p className="text-xs text-muted-foreground">OS</p>
                        <p className="text-lg font-bold text-primary">#{order.id}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{order.clientName}</p>
                        <p className="text-sm text-muted-foreground">{SERVICE_TYPE_LABELS[order.serviceType]}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={config.class}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_LABELS[order.status]}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrderList;
