import type { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { ApiError } from '../lib/api-error.js';

const voteSchema = z.object({ user_id: z.string().min(1), value: z.union([z.literal(1), z.literal(-1)]) });
const commentSchema = z.object({ body: z.string().min(1), author_id: z.string().min(1) });

/** GET /ideas/:id – idea with vote counts */
export const getIdeaById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', id)
    .single();

  if (ideaError || !idea) throw ApiError.notFound('Idea not found');

  const { data: votes } = await supabase
    .from('idea_votes')
    .select('value')
    .eq('idea_id', id);

  const up = votes?.filter((v) => v.value === 1).length ?? 0;
  const down = votes?.filter((v) => v.value === -1).length ?? 0;

  res.json({ ok: true, idea: { ...idea, votes_up: up, votes_down: down } });
});

/** POST /ideas/:id/vote – set or update user vote (body: { user_id, value: 1 | -1 }) */
export const setIdeaVote = asyncHandler(async (req: Request, res: Response) => {
  const { id: ideaId } = req.params;
  const { user_id, value } = voteSchema.parse(req.body);

  const { error } = await supabase
    .from('idea_votes')
    .upsert({ idea_id: ideaId, user_id, value }, { onConflict: 'idea_id,user_id' });

  if (error) throw ApiError.internal(error.message);
  res.status(204).send();
});

/** GET /ideas/:id/comments – list comments with author and vote counts */
export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { id: ideaId } = req.params;

  const { data: rows, error } = await supabase
    .from('idea_comments')
    .select('id, body, author_id, created_at')
    .eq('idea_id', ideaId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) throw ApiError.internal(error.message);

  const commentsWithMeta = await Promise.all(
    (rows ?? []).map(async (c) => {
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', c.author_id).maybeSingle();
      let up = 0;
      let down = 0;
      const { data: cv } = await supabase.from('idea_comment_votes').select('value').eq('comment_id', c.id);
      if (cv) {
        up = cv.filter((v: { value: number }) => v.value === 1).length;
        down = cv.filter((v: { value: number }) => v.value === -1).length;
      }
      return {
        id: c.id,
        body: c.body,
        author_id: c.author_id,
        author_name: profile?.display_name ?? 'Anonymous',
        created_at: c.created_at,
        votes_up: up,
        votes_down: down,
      };
    })
  );

  res.json({ ok: true, comments: commentsWithMeta });
});

/** POST /ideas/:id/comments – add comment (body: { body, author_id }) */
export const postComment = asyncHandler(async (req: Request, res: Response) => {
  const { id: ideaId } = req.params;
  const { body, author_id } = commentSchema.parse(req.body);

  const { data, error } = await supabase
    .from('idea_comments')
    .insert({ idea_id: ideaId, body, author_id })
    .select()
    .single();

  if (error) throw ApiError.internal(error.message);
  res.status(201).json({ ok: true, comment: data });
});

/** POST /ideas/:id/comments/:commentId/vote – comment vote (body: { user_id, value: 1 | -1 }) */
export const setCommentVote = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const { user_id, value } = voteSchema.parse(req.body);

  const { error } = await supabase
    .from('idea_comment_votes')
    .upsert({ comment_id: commentId, user_id, value }, { onConflict: 'comment_id,user_id' });

  if (error) throw ApiError.internal(error.message);
  res.status(204).send();
});
