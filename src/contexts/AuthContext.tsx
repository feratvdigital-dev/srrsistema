import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;
  login: (username: string, password: string) => boolean;
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

  const login = (username: string, password: string): boolean => {
    // Admin login
    if (username === 'srresolve' && password === 'sr604320') {
      setIsAuthenticated(true);
      setUser(username);
      localStorage.setItem('sr_auth', 'true');
      localStorage.setItem('sr_user', username);
      return true;
    }
    // Technician login
    try {
      const techs = JSON.parse(localStorage.getItem('sr_technicians') || '[]');
      const tech = techs.find((t: any) => t.username === username && t.password === password);
      if (tech) {
        setIsAuthenticated(true);
        setUser(tech.name);
        localStorage.setItem('sr_auth', 'true');
        localStorage.setItem('sr_user', tech.name);
        return true;
      }
    } catch {}
    return false;
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
