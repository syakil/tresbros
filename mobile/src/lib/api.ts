import axios from 'axios';

// Gunakan URL Backend Production
const API_URL = 'https://api-tres.syakil-dev.my.id/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
