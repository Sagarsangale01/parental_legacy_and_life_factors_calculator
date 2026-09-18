import axios from 'axios';
import { CalculationResult, User, HistoryItemSummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('parental_legacy_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 token expirations gracefully
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      const code = error.response.data?.error?.code;
      if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN' || code === 'USER_NOT_FOUND') {
        localStorage.removeItem('parental_legacy_token');
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    return Promise.reject(error);
  }
);

// Guest Session ID helper (generates or retrieves a persistent browser guest ID)
export function getGuestSessionId(): string {
  let guestId = localStorage.getItem('parental_legacy_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem('parental_legacy_guest_id', guestId);
  }
  return guestId;
}

// API Methods
export async function calculateOnServer(
  dob: string,
  save = true
): Promise<CalculationResult> {
  const guestSessionId = getGuestSessionId();
  const response = await api.post('/calculate', {
    dob,
    save,
    guestSessionId
  });
  return response.data.data;
}

export async function fetchHistory(
  page = 1,
  limit = 10
): Promise<{ calculations: HistoryItemSummary[]; pagination: any }> {
  const guestSessionId = getGuestSessionId();
  const response = await api.get('/history', {
    params: { page, limit, guestSessionId }
  });
  return response.data.data;
}

export async function fetchCalculationById(id: string): Promise<CalculationResult> {
  const response = await api.get(`/history/${id}`);
  return response.data.data;
}

export async function deleteCalculationRecord(id: string): Promise<void> {
  await api.delete(`/history/${id}`);
}

export async function registerUser(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data.data;
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: User }> {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
}

export async function fetchCurrentUser(): Promise<{ user: User }> {
  const response = await api.get('/auth/me');
  return response.data.data;
}

export async function claimGuestRecords(): Promise<{ claimedCount: number }> {
  const guestSessionId = getGuestSessionId();
  const response = await api.post('/auth/claim-guest-records', { guestSessionId });
  return response.data.data;
}
