import { API_URL, LS_TOKEN, LS_ROLE, LS_CITY } from './config';
import { getTgUser } from './telegram';

// Authenticate with backend
export async function authenticate() {
  const user = getTgUser();
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');

  const resp = await fetch(`${API_URL}/auth/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegram_id: user.id,
      username: user.username || null,
      full_name: fullName || null,
    }),
  });

  if (!resp.ok) throw new Error('Auth failed');

  const data = await resp.json();
  localStorage.setItem(LS_TOKEN, data.token);
  localStorage.setItem(LS_ROLE, data.role);
  if (data.city) localStorage.setItem(LS_CITY, data.city);

  return data;
}

// Get stored token
export function getToken(): string | null {
  return localStorage.getItem(LS_TOKEN);
}

// Get auth headers
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}
