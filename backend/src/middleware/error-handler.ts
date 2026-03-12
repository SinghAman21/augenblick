import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { env } from '../config/env.js';

/**
 * Central error handler — must be registered **after** all routes.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // Known API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      ok: false,
      error: err.message,
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    res.status(400).json({
      ok: false,
      error: 'Validation failed',
      details,
    });
    return;
  }

  // Unexpected errors
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    ok: false,
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
