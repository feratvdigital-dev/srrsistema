import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { ServiceOrder } from '@/types/serviceOrder';
import { supabase } from '@/integrations/supabase/client';

interface OrderContextType {
  orders: ServiceOrder[];
  addOrder: (order: Omit<ServiceOrder, 'id' | 'createdAt' | 'status'>) => Promise<ServiceOrder>;
  updateOrder: (id: number, updates: Partial<ServiceOrder>) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  getOrder: (id: number) => ServiceOrder | undefined;
  getNextId: () => number;
  loading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const mapDbToOrder = (row: any): ServiceOrder => ({
  id: row.id,
  clientName: row.client_name,
  clientPhone: row.client_phone,
  clientEmail: row.client_email,
  serviceType: row.service_type,
  address: row.address,
  latitude: row.latitude,
  longitude: row.longitude,
  description: row.description,
  observation: row.observation,
  photos: {
    before: row.photos_before || [],
    during: row.photos_during || [],
    after: row.photos_after || [],
  },
  laborCost: Number(row.labor_cost),
  materialCost: Number(row.material_cost),
  materialDescription: row.material_description,
  status: row.status,
  assignedTechnician: row.assigned_technician,
  createdAt: row.created_at,
  executedAt: row.executed_at,
  closedAt: row.closed_at,
});

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('service_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setOrders(data.map(mapDbToOrder));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('service_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const getNextId = useCallback(() => {
    if (orders.length === 0) return 1;
    return Math.max(...orders.map(o => o.id)) + 1;
  }, [orders]);

  const addOrder = useCallback(async (orderData: Omit<ServiceOrder, 'id' | 'createdAt' | 'status'>) => {
    const { data, error } = await supabase
      .from('service_orders')
      .insert({
        client_name: orderData.clientName,
        client_phone: orderData.clientPhone,
        client_email: orderData.clientEmail,
        service_type: orderData.serviceType,
        address: orderData.address,
        latitude: orderData.latitude,
        longitude: orderData.longitude,
        description: orderData.description,
        observation: orderData.observation,
        photos_before: orderData.photos.before,
        photos_during: orderData.photos.during,
        photos_after: orderData.photos.after,
        labor_cost: orderData.laborCost,
        material_cost: orderData.materialCost,
        material_description: orderData.materialDescription,
        assigned_technician: orderData.assignedTechnician,
      })
      .select()
      .single();

    if (error) throw error;
    const newOrder = mapDbToOrder(data);
    return newOrder;
  }, []);

  const updateOrder = useCallback(async (id: number, updates: Partial<ServiceOrder>) => {
    const dbUpdates: any = {};
    if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
    if (updates.clientPhone !== undefined) dbUpdates.client_phone = updates.clientPhone;
    if (updates.clientEmail !== undefined) dbUpdates.client_email = updates.clientEmail;
    if (updates.serviceType !== undefined) dbUpdates.service_type = updates.serviceType;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
    if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.observation !== undefined) dbUpdates.observation = updates.observation;
    if (updates.photos !== undefined) {
      dbUpdates.photos_before = updates.photos.before;
      dbUpdates.photos_during = updates.photos.during;
      dbUpdates.photos_after = updates.photos.after;
    }
    if (updates.laborCost !== undefined) dbUpdates.labor_cost = updates.laborCost;
    if (updates.materialCost !== undefined) dbUpdates.material_cost = updates.materialCost;
    if (updates.materialDescription !== undefined) dbUpdates.material_description = updates.materialDescription;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.assignedTechnician !== undefined) dbUpdates.assigned_technician = updates.assignedTechnician;
    if (updates.executedAt !== undefined) dbUpdates.executed_at = updates.executedAt;
    if (updates.closedAt !== undefined) dbUpdates.closed_at = updates.closedAt;

    const { error } = await supabase
      .from('service_orders')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
  }, []);

  const deleteOrder = useCallback(async (id: number) => {
    const { error } = await supabase
      .from('service_orders')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, []);

  const getOrder = useCallback((id: number) => {
    return orders.find(o => o.id === id);
  }, [orders]);

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrder, deleteOrder, getOrder, getNextId, loading }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within OrderProvider');
  return context;
};
