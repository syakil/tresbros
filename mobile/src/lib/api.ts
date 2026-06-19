import axios from 'axios';

// Gunakan URL API Next.js Production
const API_URL = 'https://tres.syakil-dev.my.id/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
