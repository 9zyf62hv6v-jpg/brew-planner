import axios from 'axios';

const TOKEN_KEY = 'brewclone_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const api = axios.create({
    baseURL: '/api',
});

// Подставляем токен ко всем запросам
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Глобально обрабатываем 401 — разлогиниваем
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      // Перезагружаем страницу, чтобы App увидел отсутствие токена
      if (window.location.pathname !== '/login') {
        window.location.reload();
      }
    }
    return Promise.reject(err);
  }
);

export default api;