import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { sessionRoutes } from './route/index.js';

const app = express();
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

// ── Global middleware ──────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isConfiguredOrigin = allowedOrigins.includes(origin);
      const isLocalDevOrigin =
        env.NODE_ENV === 'development' && /^https?:\/\/localhost:\d+$/.test(origin);

      if (isConfiguredOrigin || isLocalDevOrigin) {
        callback(null, origin);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ── Routes ─────────────────────────────────────────────
app.use('/api/sessions', sessionRoutes);

// ── Error handling (must be last) ──────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${env.PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});

export default app;
