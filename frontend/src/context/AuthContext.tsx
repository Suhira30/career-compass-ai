import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { storageAdapter } from '../utils/storageAdapter';

export interface AuthUser {
  id: string; // True PostgreSQL UUID from Supabase Auth
  email: string;
  name: string;
  login_at: number;
  expires_at: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isGuest: boolean;
  isAuthModalOpen: boolean;
  authModalSubtitle: string | null;
  openAuthModal: (subtitle?: string, onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  login: (email: string, name?: string) => void;
  logout: () => Promise<void>;
  touchSession: () => void;
  triggerAuthSuccess: () => void;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuest: true,
  isAuthModalOpen: false,
  authModalSubtitle: null,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signInWithPassword: async () => ({ error: null }),
  signUpWithPassword: async () => ({ error: null }),
  login: () => {},
  logout: async () => {},
  touchSession: () => {},
  triggerAuthSuccess: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalSubtitle, setAuthModalSubtitle] = useState<string | null>(null);
  const [successCallback, setSuccessCallback] = useState<(() => void) | null>(null);

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('career_compass_auth_user');
      if (saved) {
        const parsed: AuthUser = JSON.parse(saved);
        if (parsed.expires_at && Date.now() > parsed.expires_at) {
          localStorage.removeItem('career_compass_auth_user');
          return null;
        }
        return parsed;
      }
    } catch {}
    return null;
  });

  const isGuest = !user;

  // Initialize and synchronize with real Supabase Auth sessions
  useEffect(() => {
    // 1. Check existing session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Supabase getSession error:', error.message);
        return;
      }
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          login_at: Date.now(),
          expires_at: (session.expires_at || 0) * 1000 || Date.now() + SESSION_TTL_MS,
        };
        setUser(authUser);
        try {
          localStorage.setItem('career_compass_auth_user', JSON.stringify(authUser));
        } catch {}
      }
    });

    // 2. Listen to real-time auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          login_at: Date.now(),
          expires_at: (session.expires_at || 0) * 1000 || Date.now() + SESSION_TTL_MS,
        };
        setUser(authUser);
        try {
          localStorage.setItem('career_compass_auth_user', JSON.stringify(authUser));
          storageAdapter.clearLegacyUnscopedKeys();
        } catch {}
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        try {
          localStorage.removeItem('career_compass_auth_user');
          storageAdapter.clearGuestSession();
        } catch {}
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real Supabase Sign In
  const signInWithPassword = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email.trim(),
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          login_at: Date.now(),
          expires_at: (data.session?.expires_at || 0) * 1000 || Date.now() + SESSION_TTL_MS,
        };
        setUser(authUser);
        try {
          localStorage.setItem('career_compass_auth_user', JSON.stringify(authUser));
        } catch {}
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Authentication failed' };
    }
  };

  // Real Supabase Sign Up
  const signUpWithPassword = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName?.trim() || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // If Supabase has email confirmations disabled, user is immediately active
      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email.trim(),
          name: fullName?.trim() || data.user.user_metadata?.full_name || email.split('@')[0],
          login_at: Date.now(),
          expires_at: (data.session?.expires_at || 0) * 1000 || Date.now() + SESSION_TTL_MS,
        };
        setUser(authUser);
        try {
          localStorage.setItem('career_compass_auth_user', JSON.stringify(authUser));
        } catch {}
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Registration failed' };
    }
  };

  // Backwards-compatible mock login fallback (if used anywhere)
  const login = (email: string, _name?: string) => {
    signInWithPassword(email, 'DefaultPassword123!').catch(() => {});
  };

  // Real Supabase Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    }
    setUser(null);
    setIsAuthModalOpen(false);
    try {
      localStorage.removeItem('career_compass_auth_user');
      storageAdapter.clearGuestSession();
      storageAdapter.clearLegacyUnscopedKeys();
    } catch {}
  };

  const touchSession = () => {
    // Supabase autoRefreshToken handles token refresh automatically
  };

  const openAuthModal = (subtitle?: string, onSuccess?: () => void) => {
    setAuthModalSubtitle(subtitle || null);
    setSuccessCallback(() => onSuccess || null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalSubtitle(null);
    setSuccessCallback(null);
  };

  const triggerAuthSuccess = () => {
    if (successCallback) {
      successCallback();
      setSuccessCallback(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        isAuthModalOpen,
        authModalSubtitle,
        openAuthModal,
        closeAuthModal,
        signInWithPassword,
        signUpWithPassword,
        login,
        logout,
        touchSession,
        triggerAuthSuccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
