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
  status: z.string().default('active'),
});

const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().optional(),
  is_private: z.boolean().optional(),
  status: z.string().optional(),
});

// ── Handlers ──────────────────────────────────────────────────

/** GET /sessions?limit=50&offset=0 */
export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;

  const { data, error, count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw ApiError.internal(error.message);

  res.json({ ok: true, sessions: data, total: count ?? 0 });
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

  const { data, error } = await supabase
    .from('sessions')
    .insert(body)
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
