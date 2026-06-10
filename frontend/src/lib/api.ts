import { API_URL } from './config';
import { authHeaders } from './auth';
import type { User, RadioStatus, ChatMessage, Announcements, Draft, AudioSegment } from '../types';

// Users
export async function getMe(): Promise<User> {
  const resp = await fetch(`${API_URL}/users/me`, {
    headers: authHeaders(),
  });
  if (!resp.ok) throw new Error('Failed to fetch user');
  return resp.json();
}

export async function updateLanguage(language: string) {
  const resp = await fetch(`${API_URL}/users/me/language`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ language }),
  });
  if (!resp.ok) throw new Error('Failed to update language');
  return resp.json();
}

export async function updateBroadcastLang(broadcast_lang: string) {
  const resp = await fetch(`${API_URL}/users/me/broadcast-lang`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ broadcast_lang }),
  });
  if (!resp.ok) throw new Error('Failed to update broadcast lang');
  return resp.json();
}

// Radio
export async function getRadioStatus(city: string): Promise<RadioStatus> {
  const resp = await fetch(`${API_URL}/radio/status?city=${city}`);
  if (!resp.ok) throw new Error('Failed to fetch radio status');
  return resp.json();
}

export async function getPlaylist(city: string): Promise<AudioSegment[]> {
  const resp = await fetch(`${API_URL}/radio/playlist?city=${city}`);
  if (!resp.ok) throw new Error('Failed to fetch playlist');
  return resp.json();
}

export function getStreamUrl(lang: string): string {
  return `${API_URL}/radio/live/${lang}`;
}

// Chat
export async function getChatHistory(city: string): Promise<ChatMessage[]> {
  const resp = await fetch(`${API_URL}/chat/${city}`);
  if (!resp.ok) throw new Error('Failed to fetch chat history');
  return resp.json();
}

export async function sendChatMessage(city: string, message: string) {
  const resp = await fetch(`${API_URL}/chat/${city}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message }),
  });
  if (!resp.ok) throw new Error('Failed to send message');
  return resp.json();
}

export async function sendVoiceMessage(
  city: string,
  audioBlob: Blob,
  destination: 'chat' | 'studio',
  lang: string
) {
  const fd = new FormData();
  fd.append('city', city);
  fd.append('audio_file', audioBlob, 'voice.webm');
  fd.append('destination', destination);
  fd.append('lang', lang);

  const resp = await fetch(`${API_URL}/messages/voice`, {
    method: 'POST',
    headers: authHeaders(),
    body: fd,
  });

  if (!resp.ok) {
    const error: any = new Error('Failed to send voice');
    error.status = resp.status;
    error.response = resp;
    throw error;
  }

  return resp.json();
}

export async function sendTextMessage(city: string, text: string, lang: string) {
  const resp = await fetch(`${API_URL}/messages/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ city, text, lang }),
  });
  if (!resp.ok) throw new Error('Failed to send text message');
  return resp.json();
}

export async function uploadFile(city: string, file: File) {
  const fd = new FormData();
  fd.append('city', city);
  fd.append('file', file, file.name);

  const resp = await fetch(`${API_URL}/messages/file`, {
    method: 'POST',
    headers: authHeaders(),
    body: fd,
  });

  if (!resp.ok) {
    const error: any = new Error('Failed to upload file');
    error.status = resp.status;
    error.response = resp;
    throw error;
  }

  return resp.json();
}

// Announcements
export async function getAnnouncements(): Promise<Announcements> {
  const resp = await fetch(`${API_URL}/admin/announcements`);
  if (!resp.ok) throw new Error('Failed to fetch announcements');
  return resp.json();
}

export async function updateAnnouncement(slot: number, data: any) {
  const resp = await fetch(`${API_URL}/admin/announcements/${slot}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!resp.ok) throw new Error('Failed to update announcement');
  return resp.json();
}

// Admin - Drafts
export async function getDrafts(status = 'pending'): Promise<Draft[]> {
  const resp = await fetch(`${API_URL}/admin/drafts?status=${status}`, {
    headers: authHeaders(),
  });
  if (!resp.ok) throw new Error('Failed to fetch drafts');
  return resp.json();
}

export async function updateDraft(id: number, script: string) {
  const resp = await fetch(`${API_URL}/admin/drafts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ script }),
  });
  if (!resp.ok) throw new Error('Failed to update draft');
  return resp.json();
}

export async function approveDraft(id: number) {
  const resp = await fetch(`${API_URL}/admin/drafts/${id}/approve`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!resp.ok) throw new Error('Failed to approve draft');
  return resp.json();
}

export async function rejectDraft(id: number) {
  const resp = await fetch(`${API_URL}/admin/drafts/${id}/reject`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!resp.ok) throw new Error('Failed to reject draft');
  return resp.json();
}
