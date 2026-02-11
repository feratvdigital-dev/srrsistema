import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ClipboardList, AlertCircle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { STATUS_LABELS, SERVICE_TYPE_LABELS, OrderStatus } from '@/types/serviceOrder';

const statusConfig: Record<OrderStatus, { class: string; icon: React.ElementType }> = {
  open: { class: 'status-badge-open', icon: AlertCircle },
  executing: { class: 'status-badge-executing', icon: Clock },
  closed: { class: 'status-badge-closed', icon: CheckCircle2 },
};

const Dashboard = () => {
  const { orders } = useOrders();

  const stats = {
    total: orders.length,
    open: orders.filter(o => o.status === 'open').length,
    executing: orders.filter(o => o.status === 'executing').length,
    closed: orders.filter(o => o.status === 'closed').length,
  };

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos chamados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: ClipboardList, color: 'text-primary' },
          { label: 'Em Aberto', value: stats.open, icon: AlertCircle, color: 'text-blue-600' },
          { label: 'Executando', value: stats.executing, icon: Clock, color: 'text-amber-600' },
          { label: 'Encerrados', value: stats.closed, icon: CheckCircle2, color: 'text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Chamados Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum chamado registrado</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => {
                const config = statusConfig[order.status];
                const StatusIcon = config.icon;
                return (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">OS</p>
                        <p className="text-lg font-bold text-primary">#{order.id}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{order.clientName}</p>
                        <p className="text-sm text-muted-foreground">{SERVICE_TYPE_LABELS[order.serviceType]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={config.class}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_LABELS[order.status]}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
