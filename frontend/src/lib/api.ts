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

export interface SessionWithCounts extends SelectSession {
  idea_count?: number;
  comment_count?: number;
  vote_count?: number;
}

interface SessionListResponse {
  ok: boolean;
  sessions: SessionWithCounts[];
  total: number;
}

interface SessionResponse {
  ok: boolean;
  session: SelectSession;
}

export interface SessionMember {
  user_id: string;
  role: string;
  joined_at: string;
  display_name: string | null;
  email: string | null;
}

export interface SessionVoter {
  user_id: string;
  display_name: string | null;
  email: string | null;
  votes_up: number;
  votes_down: number;
}

export interface DashboardStats {
  active_sessions: number;
  total_ideas: number;
  team_members: number;
  this_week: number;
}

interface DashboardStatsResponse {
  ok: boolean;
  stats: DashboardStats;
}

export const api = {
  dashboard: {
    stats() {
      return request<DashboardStatsResponse>('/dashboard/stats');
    },
  },
  sessions: {
    list(limit = 50, offset = 0, userId?: string) {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (userId) params.append('userId', userId);
      return request<SessionListResponse>(`/sessions?${params.toString()}`);
    },

    getById(id: string) {
      return request<SessionResponse>(`/sessions/${id}`);
    },

    getMembers(sessionId: string) {
      return request<{ ok: boolean; members: SessionMember[] }>(`/sessions/${sessionId}/members`);
    },

    getVoters(sessionId: string) {
      return request<{ ok: boolean; voters: SessionVoter[] }>(`/sessions/${sessionId}/voters`);
    },

    create(body: InsertSession & { owner_email?: string; owner_display_name?: string | null }) {
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

  ideas: {
    getById(id: string) {
      return request<{ ok: boolean; idea: IdeaWithVotes }>(`/ideas/${id}`);
    },
    vote(ideaId: string, body: { user_id: string; value: 1 | -1 }) {
      return request<void>(`/ideas/${ideaId}/vote`, { method: 'POST', body: JSON.stringify(body) });
    },
    getComments(ideaId: string) {
      return request<{ ok: boolean; comments: IdeaComment[] }>(`/ideas/${ideaId}/comments`);
    },
    postComment(ideaId: string, body: { body: string; author_id: string }) {
      return request<{ ok: boolean; comment: IdeaCommentRaw }>(`/ideas/${ideaId}/comments`, { method: 'POST', body: JSON.stringify(body) });
    },
    commentVote(ideaId: string, commentId: string, body: { user_id: string; value: 1 | -1 }) {
      return request<void>(`/ideas/${ideaId}/comments/${commentId}/vote`, { method: 'POST', body: JSON.stringify(body) });
    },
  },
};

export interface IdeaWithVotes {
  id: string;
  session_id: string;
  title: string;
  description: string | null;
  color: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  votes_up: number;
  votes_down: number;
}

export interface IdeaComment {
  id: string;
  body: string;
  author_id: string | null;
  author_name: string;
  created_at: string;
  votes_up: number;
  votes_down: number;
}

export interface IdeaCommentRaw {
  id: string;
  body: string;
  author_id: string | null;
  created_at: string;
}
