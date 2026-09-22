import React, { createContext, useContext, useEffect, useState } from 'react';
import { storageAdapter } from '../utils/storageAdapter';

export interface AuthUser {
  id: string; // UUID from Supabase or generated
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
  login: (email: string, name?: string) => void;
  logout: () => void;
  touchSession: () => void;
  triggerAuthSuccess: () => void;
}

// Default session expiration: 24 hours of inactivity
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export const generateUserIdForEmail = (email: string): string => {
  const clean = email.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash) + clean.charCodeAt(i);
    hash |= 0;
  }
  const prefix = clean.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'user';
  return `usr_${prefix}_${Math.abs(hash).toString(36)}`;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuest: true,
  isAuthModalOpen: false,
  authModalSubtitle: null,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  login: () => {},
  logout: () => {},
  touchSession: () => {},
  triggerAuthSuccess: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('career_compass_auth_user');
      if (saved) {
        const parsed: AuthUser = JSON.parse(saved);
        // Enforce Session TTL validation (reject stale sessions)
        if (parsed.expires_at && Date.now() > parsed.expires_at) {
          console.info('Career Compass: Auth session expired. Resetting to guest mode.');
          localStorage.removeItem('career_compass_auth_user');
          return null;
        }
        return parsed;
      }
    } catch {}
    return null;
  });

  const isGuest = !user;

  // Periodic check for session expiration (every 60 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (user.expires_at && Date.now() > user.expires_at) {
        console.warn('Career Compass: Session TTL expired. Logging out.');
        logout();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const login = (email: string, name?: string) => {
    const now = Date.now();
    const expiresAt = now + SESSION_TTL_MS;

    const authUser: AuthUser = {
      id: generateUserIdForEmail(email),
      email: email.trim(),
      name: name?.trim() || email.split('@')[0],
      login_at: now,
      expires_at: expiresAt,
    };

    setUser(authUser);
    try {
      localStorage.setItem('career_compass_auth_user', JSON.stringify(authUser));
      // Purge any legacy unscoped data from localStorage
      storageAdapter.clearLegacyUnscopedKeys();
    } catch (err) {
      console.warn('Could not persist auth user to localStorage:', err);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthModalOpen(false);
    try {
      localStorage.removeItem('career_compass_auth_user');
      storageAdapter.clearGuestSession();
      storageAdapter.clearLegacyUnscopedKeys();
    } catch (err) {
      console.warn('Could not clear auth user from localStorage:', err);
    }
  };

  // Extend session on user activity (sliding session expiration)
  const touchSession = () => {
    if (!user) return;
    const now = Date.now();
    // Only refresh if more than 30 mins have elapsed since last login/refresh
    if (user.expires_at - now < SESSION_TTL_MS - 30 * 60 * 1000) {
      const updatedUser: AuthUser = {
        ...user,
        expires_at: now + SESSION_TTL_MS,
      };
      setUser(updatedUser);
      try {
        localStorage.setItem('career_compass_auth_user', JSON.stringify(updatedUser));
      } catch {}
    }
  };

  const [authModalSubtitle, setAuthModalSubtitle] = useState<string | null>(null);
  const [successCallback, setSuccessCallback] = useState<(() => void) | null>(null);

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
