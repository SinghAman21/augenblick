import { Router } from 'express';
import {
  getIdeaById,
  setIdeaVote,
  getComments,
  postComment,
  setCommentVote,
} from '../controllers/idea.controller.js';

const router = Router();

router.get('/:id', getIdeaById);
router.post('/:id/vote', setIdeaVote);
router.get('/:id/comments', getComments);
router.post('/:id/comments', postComment);
router.post('/:id/comments/:commentId/vote', setCommentVote);

export default router;
