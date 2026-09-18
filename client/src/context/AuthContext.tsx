import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { loginUser, registerUser, fetchCurrentUser, claimGuestRecords } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('parental_legacy_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await fetchCurrentUser();
      setUser(data.user);
    } catch {
      localStorage.removeItem('parental_legacy_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Listen for session expiration events emitted by Axios interceptor
  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
      setUser(null);
      openAuthModal('login');
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await loginUser(email, pass);
      localStorage.setItem('parental_legacy_token', data.token);
      setToken(data.token);
      setUser(data.user);
      closeAuthModal();

      // Automatically migrate any prior guest calculations to this account
      try {
        await claimGuestRecords();
      } catch (e) {
        console.warn('Guest calculations claim warning:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await registerUser(name, email, pass);
      localStorage.setItem('parental_legacy_token', data.token);
      setToken(data.token);
      setUser(data.user);
      closeAuthModal();

      // Automatically claim any guest calculations
      try {
        await claimGuestRecords();
      } catch (e) {
        console.warn('Guest calculations claim warning:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('parental_legacy_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
