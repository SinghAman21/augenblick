import type { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { ApiError } from '../lib/api-error.js';

// ── Validation schemas ────────────────────────────────────────

const createSessionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  category: z.string().default('product'),
  is_private: z.boolean().default(false),
  owner_id: z.string().nullable().optional(),
  owner_email: z.string().email().optional(),
  owner_display_name: z.string().nullable().optional(),
  status: z.string().default('active'),
}).refine(
  (data) => !data.owner_id || (data.owner_id && data.owner_email),
  { message: 'owner_email is required when owner_id is provided', path: ['owner_email'] }
);

const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().optional(),
  is_private: z.boolean().optional(),
  status: z.string().optional(),
});

// ── Handlers ──────────────────────────────────────────────────

/** GET /sessions?limit=50&offset=0 – returns sessions with idea_count, comment_count, vote_count */
export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;

  const { data: sessions, error, count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw ApiError.internal(error.message);
  if (!sessions?.length) {
    res.json({ ok: true, sessions: [], total: count ?? 0 });
    return;
  }

  const sessionIds = sessions.map((s) => s.id);
  const { data: ideas } = await supabase.from('ideas').select('id, session_id').in('session_id', sessionIds);
  const ideaIds = ideas?.map((i) => i.id) ?? [];
  const sessionIdToIdeas = new Map<string, { id: string }[]>();
  for (const i of ideas ?? []) {
    const list = sessionIdToIdeas.get(i.session_id) ?? [];
    list.push({ id: i.id });
    sessionIdToIdeas.set(i.session_id, list);
  }

  let commentCountByIdea: Record<string, number> = {};
  let voteCountByIdea: Record<string, number> = {};
  if (ideaIds.length > 0) {
    const { data: commentRows } = await supabase
      .from('idea_comments')
      .select('idea_id')
      .in('idea_id', ideaIds)
      .eq('is_deleted', false);
    for (const r of commentRows ?? []) {
      commentCountByIdea[r.idea_id] = (commentCountByIdea[r.idea_id] ?? 0) + 1;
    }
    const { data: voteRows } = await supabase.from('idea_votes').select('idea_id').in('idea_id', ideaIds);
    for (const r of voteRows ?? []) {
      voteCountByIdea[r.idea_id] = (voteCountByIdea[r.idea_id] ?? 0) + 1;
    }
  }

  const sessionsWithCounts = sessions.map((s) => {
    const sessionIdeas = sessionIdToIdeas.get(s.id) ?? [];
    const idea_count = sessionIdeas.length;
    const comment_count = sessionIdeas.reduce((sum, i) => sum + (commentCountByIdea[i.id] ?? 0), 0);
    const vote_count = sessionIdeas.reduce((sum, i) => sum + (voteCountByIdea[i.id] ?? 0), 0);
    return { ...s, idea_count, comment_count, vote_count };
  });

  res.json({ ok: true, sessions: sessionsWithCounts, total: count ?? 0 });
});

/** GET /sessions/:id */
export const getSessionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw ApiError.notFound('Session not found');

  res.json({ ok: true, session: data });
});

/** POST /sessions */
export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const body = createSessionSchema.parse(req.body);

  // If owner_id is provided, ensure the profile exists so the sessions.owner_id FK is satisfied.
  // (Frontend sends Clerk user id; we sync it to Supabase profiles.)
  if (body.owner_id && body.owner_email) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: body.owner_id,
          email: body.owner_email,
          display_name: body.owner_display_name ?? '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (profileError) throw ApiError.internal(profileError.message);
  }

  const insertPayload = {
    title: body.title,
    description: body.description ?? null,
    category: body.category,
    is_private: body.is_private,
    status: body.status,
    owner_id: body.owner_id ?? null,
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw ApiError.internal(error.message);

  res.status(201).json({ ok: true, session: data });
});

/** PATCH /sessions/:id */
export const updateSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = updateSessionSchema.parse(req.body);

  const { data, error } = await supabase
    .from('sessions')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) throw ApiError.notFound('Session not found');

  res.json({ ok: true, session: data });
});

/** DELETE /sessions/:id */
export const deleteSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);

  if (error) throw ApiError.internal(error.message);

  res.status(204).send();
});

/** GET /sessions/:id/members – list collaborators with profile (display_name, email) */
export const getSessionMembers = asyncHandler(async (req: Request, res: Response) => {
  const { id: sessionId } = req.params;

  const { data: members, error: membersError } = await supabase
    .from('session_members')
    .select('user_id, role, joined_at')
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: true });

  if (membersError) throw ApiError.internal(membersError.message);

  const membersWithProfile = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', m.user_id)
        .maybeSingle();
      return {
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        display_name: profile?.display_name ?? null,
        email: profile?.email ?? null,
      };
    })
  );

  res.json({ ok: true, members: membersWithProfile });
});

/** GET /sessions/:id/voters – list users who voted on any idea in this session */
export const getSessionVoters = asyncHandler(async (req: Request, res: Response) => {
  const { id: sessionId } = req.params;

  const { data: sessionIdeas, error: ideasError } = await supabase
    .from('ideas')
    .select('id')
    .eq('session_id', sessionId);

  if (ideasError || !sessionIdeas?.length) {
    return res.json({ ok: true, voters: [] });
  }

  const ideaIds = sessionIdeas.map((i) => i.id);
  const { data: votes, error: votesError } = await supabase
    .from('idea_votes')
    .select('user_id, value')
    .in('idea_id', ideaIds);

  if (votesError) throw ApiError.internal(votesError.message);

  const byUser = new Map<string, { up: number; down: number }>();
  for (const v of votes ?? []) {
    const cur = byUser.get(v.user_id) ?? { up: 0, down: 0 };
    if (v.value === 1) cur.up += 1;
    else cur.down += 1;
    byUser.set(v.user_id, cur);
  }

  const votersWithProfile = await Promise.all(
    Array.from(byUser.entries()).map(async ([user_id, counts]) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', user_id)
        .maybeSingle();
      return {
        user_id,
        display_name: profile?.display_name ?? null,
        email: profile?.email ?? null,
        votes_up: counts.up,
        votes_down: counts.down,
      };
    })
  );

  res.json({ ok: true, voters: votersWithProfile });
});
