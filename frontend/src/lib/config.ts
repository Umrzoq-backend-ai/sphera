// API konfiguratsiyasi
// Vite environment variables: import.meta.env
const getApiUrl = () => {
  // 1. Birinchi navbatda env dan olish
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. Agar env bo'lmasa, port 8080 bo'lsa backend 8001 da deb hisoblaymiz
  const IS_PORT_8080 = location.port === '8080';
  if (IS_PORT_8080) {
    return `http://${location.hostname}:8001`;
  }
  
  // 3. Aks holda same origin
  return location.origin;
};

export const API_URL = getApiUrl();
export const WS_URL = import.meta.env.VITE_WS_URL || API_URL.replace(/^http/, 'ws');
export const RADIO_URL = import.meta.env.VITE_RADIO_URL || API_URL;

// LocalStorage keys
export const LS_TOKEN = 'sfera5_token';
export const LS_CITY = 'sfera5_city';
export const LS_ROLE = 'sfera5_role';
export const LS_LANG = 'sfera5_lang';

// Default city
export const DEFAULT_CITY = import.meta.env.VITE_DEFAULT_CITY || 'global';

// Telegram WebApp
export const getTelegram = () => {
  return window.Telegram?.WebApp || null;
};
