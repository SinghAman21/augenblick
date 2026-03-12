import { Router } from 'express';
import { postAI } from '../controllers/ai.controller.js';

const router = Router();
router.post('/', postAI);
export default router;
