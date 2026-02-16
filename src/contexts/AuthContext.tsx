import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;
  role: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'sr_session';

interface SessionData {
  user: string;
  role: string;
  token: string;
  expiresAt: number;
}

function getStoredSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: SessionData = JSON.parse(raw);
    // Check expiration (24h)
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<SessionData | null>(() => getStoredSession());

  const isAuthenticated = !!session;
  const user = session?.user ?? null;
  const role = session?.role ?? null;

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      if (!username.trim() || !password) return false;

      const { data, error } = await supabase.functions.invoke('authenticate', {
        body: { username: username.trim(), password },
      });

      if (error || !data?.success) {
        return false;
      }

      const newSession: SessionData = {
        user: data.user,
        role: data.role,
        token: data.sessionToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
      };

      setSession(newSession);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));

      // Clean up legacy localStorage
      localStorage.removeItem('sr_auth');
      localStorage.removeItem('sr_user');

      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setSession(null);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('sr_auth');
    localStorage.removeItem('sr_user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
