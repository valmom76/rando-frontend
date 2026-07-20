import axios from 'axios';
import { authStore } from '../auth/store';
import { API_BASE_URL } from './config';

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

// Interceptor de requisição: adiciona o token JWT em todas as chamadas
http.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }

  const token = authStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta: captura erros 401 e redireciona para login
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token inválido ou expirado - limpa storage e redireciona
      authStore.clear();
      
      // Só redireciona se não estiver na página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { http };
