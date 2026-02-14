import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('sr_auth') === 'true';
  });
  const [user, setUser] = useState<string | null>(() => {
    return localStorage.getItem('sr_user');
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Authenticate via server-side edge function — passwords never exposed to client
      const { data, error } = await supabase.functions.invoke('authenticate', {
        body: { username: username.trim(), password },
      });

      if (error || !data?.success) {
        return false;
      }

      setIsAuthenticated(true);
      setUser(data.user);
      localStorage.setItem('sr_auth', 'true');
      localStorage.setItem('sr_user', data.user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('sr_auth');
    localStorage.removeItem('sr_user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
