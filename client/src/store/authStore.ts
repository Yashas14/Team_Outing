import { create } from 'zustand';
import { authenticateUser, setupPassword, getUserById, initDB } from '../lib/localDB';
import { connectSocket, disconnectSocket } from '../lib/socket';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requiresPasswordSetup?: boolean; user?: User }>;
  setupNewPassword: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    initDB();
    const result = authenticateUser(email, password);
    if (!result) throw new Error('Invalid email or password. Check your credentials and try again.');

    if (result.requiresPasswordSetup) {
      return { requiresPasswordSetup: true };
    }

    localStorage.setItem('user', JSON.stringify(result.user));
    set({ user: result.user, isAuthenticated: true, isLoading: false });
    connectSocket(result.user.role);
    return { user: result.user };
  },

  setupNewPassword: async (email: string, password: string) => {
    const user = setupPassword(email, password);
    if (!user) throw new Error('User not found');

    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
    connectSocket(user.role);
  },

  logout: () => {
    localStorage.removeItem('user');
    disconnectSocket();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: () => {
    initDB();
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored) as User;
        // Verify user still exists in DB
        const fresh = getUserById(user.id);
        if (fresh) {
          set({ user: fresh, isAuthenticated: true, isLoading: false });
          connectSocket(fresh.role);
          return;
        }
      }
      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const currentUser = get().user;
      if (!currentUser) return;
      const fresh = getUserById(currentUser.id);
      if (fresh) {
        localStorage.setItem('user', JSON.stringify(fresh));
        set({ user: fresh });
      } else {
        get().logout();
      }
    } catch {
      get().logout();
    }
  },
}));
