import React, { createContext, useContext, useState } from 'react';

export interface AuthUser {
  id: string; // UUID from Supabase or generated
  email: string;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isGuest: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuest: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('career_compass_auth_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return null;
  });

  const isGuest = !user;

  const login = (email: string, name?: string) => {
    // In production, Supabase Auth issues this UUID
    // Generate deterministic or random UUID for seamless session
    const id = 'usr_' + Math.random().toString(36).substring(2, 11);
    const authUser: AuthUser = {
      id,
      email,
      name: name || email.split('@')[0],
    };
    setUser(authUser);
    try {
      localStorage.setItem('career_compass_auth_user', JSON.stringify(authUser));
    } catch {}
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('career_compass_auth_user');
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

