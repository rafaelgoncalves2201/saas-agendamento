import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'PROFESSIONAL' | 'STAFF';
  companyId?: string | null;
  company?: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem('@saas:token');
  const savedUser = localStorage.getItem('@saas:user');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken || null,
    isAuthenticated: !!savedToken,
    setAuth: (user, token, refreshToken) => {
      localStorage.setItem('@saas:token', token);
      localStorage.setItem('@saas:refreshToken', refreshToken);
      localStorage.setItem('@saas:user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('@saas:token');
      localStorage.removeItem('@saas:refreshToken');
      localStorage.removeItem('@saas:user');
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});

