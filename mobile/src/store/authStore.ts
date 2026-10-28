import { create } from 'zustand';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  verified_email: boolean;
  phone?: string;
  bio?: string;
  avatar_url?: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  // True only until the app's one-time boot-time session check resolves.
  // Kept separate from isLoading so a later getCurrentUser() refresh (e.g.
  // after applying as a provider) doesn't re-trigger App()'s full-screen
  // gate and unmount the whole navigation tree mid-flow.
  isInitializing: boolean;
  error: string | null;
  isAuthenticated: boolean;
  // dev-mode-only verification link from the most recent register() call —
  // the app has already switched to MainTabs by the time this resolves (auth
  // flips true immediately), so unlike password reset there's no LoginStack
  // screen left to hand it to directly; ProfileScreen's verify-email banner
  // reads it instead.
  pendingVerifyLink: string | null;

  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  initialize: () => Promise<void>;
  updateProfile: (updates: Partial<{ first_name: string; last_name: string; phone: string; bio: string }>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isInitializing: true,
  error: null,
  isAuthenticated: false,
  pendingVerifyLink: null,

  register: async (email, password, firstName, lastName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.register(email, password, firstName, lastName);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        pendingVerifyLink: response.dev_verify_link || null,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.login(email, password);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout();
      set({ user: null, isAuthenticated: false, isLoading: false, pendingVerifyLink: null });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Refreshes the current user without touching isLoading, so callers deep
  // in the navigation tree (e.g. after applying as a provider) don't trip
  // App()'s full-screen gate and unmount the tree they're running in.
  getCurrentUser: async () => {
    try {
      const response = await api.getCurrentUser();
      set({ user: response.user, isAuthenticated: true });
    } catch (error: any) {
      set({ user: null, isAuthenticated: false });
    }
  },

  // Runs once at app boot to restore a session from a stored token. This is
  // the only thing App()'s full-screen loading gate should wait on.
  initialize: async () => {
    try {
      const response = await api.getCurrentUser();
      set({ user: response.user, isAuthenticated: true, isInitializing: false });
    } catch (error: any) {
      set({ user: null, isAuthenticated: false, isInitializing: false });
    }
  },

  // Deliberately doesn't touch isLoading — same reasoning as getCurrentUser:
  // this can be called from a screen deep in the tree, and isLoading gates
  // App()'s full-screen spinner. The screen manages its own submit state.
  updateProfile: async (updates) => {
    const response = await api.updateProfile(updates);
    set({ user: response.user });
  },

  clearError: () => set({ error: null }),
}));
