// User va Profile
export interface User {
  telegram_id: number;
  username: string | null;
  full_name: string | null;
  role: 'slusatel' | 'aktivniy' | 'doverenniy' | 'admin';
  points: number;
  language: 'ru' | 'lt' | 'en';
  broadcast_lang: 'ru' | 'lt' | 'en';
  city?: string;
  psychotype?: Psychotype;
}

export interface Psychotype {
  emotional_tone: 'optimist' | 'melanxolik' | 'ratsional';
  focus_of_attention: 'vnutrenniy' | 'vneshniy';
  key_topic: string;
}

// Chat Messages
export interface ChatMessage {
  id: number;
  telegram_id: number;
  username: string | null;
  message: string | null;
  voice_url: string | null;
  file_url: string | null;
  file_name: string | null;
  duration_sec: number | null;
  kind: 'chat' | 'studio' | 'ai';
  created_at: string;
}

// Radio Status
export interface RadioStatus {
  is_live: boolean;
  broadcaster_type: 'ai' | 'doverenniy' | null;
  broadcaster_name: string | null;
  use_icecast: boolean;
  stream_url: string | null;
  listeners_count?: number;
}

// Announcement Banner
export interface Announcement {
  emoji: string;
  title: string;
  text: string;
  image_url: string | null;
}

export interface Announcements {
  banner1: Announcement | null;
  banner2: Announcement | null;
}

// AI Draft (Admin)
export interface Draft {
  id: number;
  city: string;
  main_topic: string | null;
  script: string;
  source_count: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// Audio Segment
export interface AudioSegment {
  id: number;
  url: string;
  script: string;
  duration_sec: number;
}

// WebSocket Events
export type WSMessageType =
  | 'chat'
  | 'radio_status'
  | 'presence'
  | 'new_segment'
  | 'role_up'
  | 'studio_ack'
  | 'limit_exceeded'
  | 'studio_denied'
  | 'balance'
  | 'ping';

export interface WSMessage {
  type: WSMessageType;
  data?: any;
}

// Navigation
export type Screen = 'anons' | 'efir' | 'profile' | 'stats' | 'favorites';

// Language (re-export from locales)
export type { Language } from '../locales';
