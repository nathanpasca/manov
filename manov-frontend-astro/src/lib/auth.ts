import { useState, useEffect } from 'react';
import type { User } from './types';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const setAuth = (token: string, user: User) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new Event('auth-change'));
};

export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-change'));
};

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      setToken(getToken());
      setUser(getUser());
      setLoading(false);
    };
    sync();
    window.addEventListener('auth-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('auth-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const login = (newToken: string, userData: User) => {
    setAuth(newToken, userData);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  return { user, token, loading, login, logout };
};
