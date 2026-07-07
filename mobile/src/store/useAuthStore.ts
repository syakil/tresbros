import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: any | null;
  setAuth: (token: string | null, user: any | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}));
