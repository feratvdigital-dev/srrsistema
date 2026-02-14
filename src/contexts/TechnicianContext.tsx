import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Technician } from '@/types/technician';
import { supabase } from '@/integrations/supabase/client';

interface TechnicianContextType {
  technicians: Technician[];
  addTechnician: (tech: Omit<Technician, 'id'>) => Promise<void>;
  updateTechnician: (id: string, updates: Partial<Technician>) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;
  getTechnician: (id: string) => Technician | undefined;
  loading: boolean;
}

const TechnicianContext = createContext<TechnicianContextType | undefined>(undefined);

const mapDbToTech = (row: any): Technician => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  specialty: row.specialty,
  status: row.status,
  rg: row.rg,
  cpf: row.cpf,
  profilePhoto: row.profile_photo,
  documentPhoto: row.document_photo,
  username: row.username,
  password: row.password,
});

export const TechnicianProvider = ({ children }: { children: ReactNode }) => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTechnicians = useCallback(async () => {
    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .order('name');
    if (!error && data) {
      setTechnicians(data.map(mapDbToTech));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  const addTechnician = useCallback(async (tech: Omit<Technician, 'id'>) => {
    const { error } = await supabase
      .from('technicians')
      .insert({
        name: tech.name,
        phone: tech.phone,
        email: tech.email,
        specialty: tech.specialty,
        status: tech.status,
        rg: tech.rg,
        cpf: tech.cpf,
        profile_photo: tech.profilePhoto,
        document_photo: tech.documentPhoto,
        username: tech.username,
        password: tech.password,
      });
    if (error) throw error;
    await fetchTechnicians();
  }, [fetchTechnicians]);

  const updateTechnician = useCallback(async (id: string, updates: Partial<Technician>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.specialty !== undefined) dbUpdates.specialty = updates.specialty;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.rg !== undefined) dbUpdates.rg = updates.rg;
    if (updates.cpf !== undefined) dbUpdates.cpf = updates.cpf;
    if (updates.profilePhoto !== undefined) dbUpdates.profile_photo = updates.profilePhoto;
    if (updates.documentPhoto !== undefined) dbUpdates.document_photo = updates.documentPhoto;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.password !== undefined) dbUpdates.password = updates.password;

    const { error } = await supabase
      .from('technicians')
      .update(dbUpdates)
      .eq('id', id);
    if (error) throw error;
    await fetchTechnicians();
  }, [fetchTechnicians]);

  const deleteTechnician = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('technicians')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchTechnicians();
  }, [fetchTechnicians]);

  const getTechnician = useCallback((id: string) => technicians.find(t => t.id === id), [technicians]);

  return (
    <TechnicianContext.Provider value={{ technicians, addTechnician, updateTechnician, deleteTechnician, getTechnician, loading }}>
      {children}
    </TechnicianContext.Provider>
  );
};

export const useTechnicians = () => {
  const ctx = useContext(TechnicianContext);
  if (!ctx) throw new Error('useTechnicians must be used within TechnicianProvider');
  return ctx;
};
