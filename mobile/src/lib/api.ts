import axios from 'axios';

// Gunakan IP Address komputer saat menjalankan Web Next.js (bukan localhost)
const API_URL = 'http://192.168.1.3:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
