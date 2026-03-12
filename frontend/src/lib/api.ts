import type { InsertSession, SelectSession } from '@/db/schema';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/** Thin wrapper around fetch that throws on non-ok responses. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  // 204 No Content (e.g. DELETE)
  if (res.status === 204) return undefined as T;

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
  return json;
}

// ── Sessions ──────────────────────────────────────────────

interface SessionListResponse {
  ok: boolean;
  sessions: SelectSession[];
  total: number;
}

interface SessionResponse {
  ok: boolean;
  session: SelectSession;
}

export const api = {
  sessions: {
    list(limit = 50, offset = 0) {
      return request<SessionListResponse>(`/sessions?limit=${limit}&offset=${offset}`);
    },

    getById(id: string) {
      return request<SessionResponse>(`/sessions/${id}`);
    },

    create(body: InsertSession) {
      return request<SessionResponse>('/sessions', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    update(id: string, body: Partial<InsertSession>) {
      return request<SessionResponse>(`/sessions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },

    delete(id: string) {
      return request<void>(`/sessions/${id}`, { method: 'DELETE' });
    },
  },
};
