import { Router } from 'express';
import {
  listSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/index.js';

const router = Router();

router.get('/', listSessions);
router.get('/:id', getSessionById);
router.post('/', createSession);
router.patch('/:id', updateSession);
router.delete('/:id', deleteSession);

export default router;
