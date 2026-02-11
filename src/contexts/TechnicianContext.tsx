import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Technician } from '@/types/technician';

interface TechnicianContextType {
  technicians: Technician[];
  addTechnician: (tech: Omit<Technician, 'id'>) => void;
  updateTechnician: (id: string, updates: Partial<Technician>) => void;
  deleteTechnician: (id: string) => void;
  getTechnician: (id: string) => Technician | undefined;
}

const TechnicianContext = createContext<TechnicianContextType | undefined>(undefined);
const STORAGE_KEY = 'sr_technicians';

const load = (): Technician[] => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
};
const save = (t: Technician[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(t));

export const TechnicianProvider = ({ children }: { children: ReactNode }) => {
  const [technicians, setTechnicians] = useState<Technician[]>(load);

  const addTechnician = useCallback((tech: Omit<Technician, 'id'>) => {
    setTechnicians(prev => {
      const updated = [...prev, { ...tech, id: crypto.randomUUID() }];
      save(updated);
      return updated;
    });
  }, []);

  const updateTechnician = useCallback((id: string, updates: Partial<Technician>) => {
    setTechnicians(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      save(updated);
      return updated;
    });
  }, []);

  const deleteTechnician = useCallback((id: string) => {
    setTechnicians(prev => {
      const updated = prev.filter(t => t.id !== id);
      save(updated);
      return updated;
    });
  }, []);

  const getTechnician = useCallback((id: string) => technicians.find(t => t.id === id), [technicians]);

  return (
    <TechnicianContext.Provider value={{ technicians, addTechnician, updateTechnician, deleteTechnician, getTechnician }}>
      {children}
    </TechnicianContext.Provider>
  );
};

export const useTechnicians = () => {
  const ctx = useContext(TechnicianContext);
  if (!ctx) throw new Error('useTechnicians must be used within TechnicianProvider');
  return ctx;
};
