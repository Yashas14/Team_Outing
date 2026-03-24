import { create } from 'zustand';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import type { User, LoginResponse } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    set({ user: data.user, isAuthenticated: true });
    connectSocket(data.user.role);
  },

  logout: () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    disconnectSocket();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: () => {
    try {
      const stored = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      if (stored && token) {
        const user = JSON.parse(stored) as User;
        set({ user, isAuthenticated: true, isLoading: false });
        connectSocket(user.role);
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const { data } = await api.get<User>('/auth/me');
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data });
    } catch {
      get().logout();
    }
  },
}));
