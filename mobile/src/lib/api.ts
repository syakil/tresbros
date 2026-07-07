import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://tres.syakil-dev.my.id/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
