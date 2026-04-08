import { create } from 'zustand';
import axios from 'axios';
import type { User } from '../types/api';

interface AuthState {
  token: string | null;
  user: User | null;
  registrationEmail: string;
  theme: 'light' | 'dark';
  setAuth: (token: string, user: User) => void;
  setRegistrationEmail: (email: string) => void;
  logout: () => void;
  toggleTheme: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  registrationEmail: '',
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  setRegistrationEmail: (email) => set({ registrationEmail: email }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    return { theme: newTheme };
  }),
}));

export const api = axios.create({ baseURL: 'http://localhost:3000' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});