import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { ApiError } from '../lib/api-error.js';

/** GET /dashboard/stats – dashboard summary counts */
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [sessionsRes, ideasRes, membersRes, weekRes] = await Promise.all([
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('ideas').select('*', { count: 'exact', head: true }),
    supabase.from('session_members').select('user_id'),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
  ]);

  if (sessionsRes.error) throw ApiError.internal(sessionsRes.error.message);
  if (ideasRes.error) throw ApiError.internal(ideasRes.error.message);
  if (membersRes.error) throw ApiError.internal(membersRes.error.message);
  if (weekRes.error) throw ApiError.internal(weekRes.error.message);

  const teamMembers = new Set((membersRes.data ?? []).map((r: { user_id: string }) => r.user_id)).size;

  res.json({
    ok: true,
    stats: {
      active_sessions: sessionsRes.count ?? 0,
      total_ideas: ideasRes.count ?? 0,
      team_members: teamMembers,
      this_week: weekRes.count ?? 0,
    },
  });
});
