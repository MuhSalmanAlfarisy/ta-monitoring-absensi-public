import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const SESSION_MESSAGE_KEY = 'session_expired_message';
export const SESSION_EXPIRED_MESSAGE = 'Sesi Anda telah berakhir. Silakan login kembali.';

const PUBLIC_PATH_PREFIXES = [
  '/api/system/auth/check-registration',
  '/api/system/auth/login-google',
  '/api/system/auth/register',
  '/api/system/auth/register-completion',
  '/api/system/auth/cleanup-phantom',
  '/api/system/log-activity',
  '/api/system/health',
  '/health',
];

let isHandlingSessionExpiry = false;
let interceptorsInitialized = false;

function getCurrentAppPath(): string {
  const hash = window.location.hash || '';
  if (hash.startsWith('#/')) {
    return hash.slice(1).split('?')[0] || '/';
  }
  return window.location.pathname;
}

function toHashPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `/#${normalizedPath}`;
}

function getPathFromConfig(config?: InternalAxiosRequestConfig | any): string {
  const url = config?.url;
  const baseURL = config?.baseURL || API_BASE_URL;
  if (!url) return '';

  try {
    return new URL(url, baseURL).pathname;
  } catch {
    return typeof url === 'string' ? url : '';
  }
}

function isPublicRequest(config?: InternalAxiosRequestConfig | any): boolean {
  const path = getPathFromConfig(config);
  return PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function hasAuthorizationHeader(config?: InternalAxiosRequestConfig | any): boolean {
  const headers: any = config?.headers;
  if (!headers) return false;

  if (typeof headers.get === 'function') {
    return Boolean(headers.get('Authorization'));
  }

  return Boolean(headers.Authorization || headers.authorization);
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }
  return payload.exp * 1000 <= Date.now();
}

export function hasValidSessionToken(): boolean {
  const token = localStorage.getItem('token');
  return Boolean(token) && !isTokenExpired(token as string);
}

export function consumeSessionMessage(): string | null {
  const message = sessionStorage.getItem(SESSION_MESSAGE_KEY);
  if (message) {
    sessionStorage.removeItem(SESSION_MESSAGE_KEY);
  }
  return message;
}

export function forceLogoutToLogin(message: string = SESSION_EXPIRED_MESSAGE): void {
  if (isHandlingSessionExpiry) {
    return;
  }

  isHandlingSessionExpiry = true;
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  sessionStorage.setItem(SESSION_MESSAGE_KEY, message);

  if (getCurrentAppPath() !== '/login') {
    window.location.replace(toHashPath('/login'));
  }

  setTimeout(() => {
    isHandlingSessionExpiry = false;
  }, 400);
}

export function getValidTokenOrLogout(): string | null {
  const token = localStorage.getItem('token');
  if (!token) {
    forceLogoutToLogin();
    return null;
  }

  if (isTokenExpired(token)) {
    forceLogoutToLogin();
    return null;
  }

  return token;
}

function handle401IfNeeded(error: AxiosError): void {
  if (error.response?.status !== 401) {
    return;
  }

  if (isPublicRequest(error.config)) {
    return;
  }

  if (!hasAuthorizationHeader(error.config)) {
    return;
  }

  forceLogoutToLogin();
}

function setupResponseInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      handle401IfNeeded(error);
      return Promise.reject(error);
    }
  );
}

function setupApiRequestInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    (config) => {
      if (isPublicRequest(config)) {
        return config;
      }

      const token = getValidTokenOrLogout();
      if (!token) {
        return Promise.reject(new axios.CanceledError('No valid token'));
      }

      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );
}

function initInterceptors(): void {
  if (interceptorsInitialized) {
    return;
  }
  interceptorsInitialized = true;

  setupApiRequestInterceptor(api);
  setupResponseInterceptor(api);
  setupResponseInterceptor(axios);
}

// Axios instance utama untuk endpoint internal/protected.
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    indexes: null, // Berfungsi untuk Axios >= 1.0.0 agar array diulang: k=1&k=2
  },
});

initInterceptors();
