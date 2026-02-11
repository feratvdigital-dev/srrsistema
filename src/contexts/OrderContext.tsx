import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ServiceOrder } from '@/types/serviceOrder';

interface OrderContextType {
  orders: ServiceOrder[];
  addOrder: (order: Omit<ServiceOrder, 'id' | 'createdAt' | 'status'>) => ServiceOrder;
  updateOrder: (id: number, updates: Partial<ServiceOrder>) => void;
  getOrder: (id: number) => ServiceOrder | undefined;
  getNextId: () => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const STORAGE_KEY = 'sr_orders';

const loadOrders = (): ServiceOrder[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveOrders = (orders: ServiceOrder[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>(loadOrders);

  const getNextId = useCallback(() => {
    if (orders.length === 0) return 1;
    return Math.max(...orders.map(o => o.id)) + 1;
  }, [orders]);

  const addOrder = useCallback((orderData: Omit<ServiceOrder, 'id' | 'createdAt' | 'status'>) => {
    const newOrder: ServiceOrder = {
      ...orderData,
      id: getNextId(),
      createdAt: new Date().toISOString(),
      status: 'open',
    };
    setOrders(prev => {
      const updated = [...prev, newOrder];
      saveOrders(updated);
      return updated;
    });
    return newOrder;
  }, [getNextId]);

  const updateOrder = useCallback((id: number, updates: Partial<ServiceOrder>) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, ...updates } : o);
      saveOrders(updated);
      return updated;
    });
  }, []);

  const getOrder = useCallback((id: number) => {
    return orders.find(o => o.id === id);
  }, [orders]);

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrder, getOrder, getNextId }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within OrderProvider');
  return context;
};
