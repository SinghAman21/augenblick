import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema } from 'zod';

/**
 * Returns middleware that validates `req.body` against the given Zod schema.
 * Parsed (& coerced) data is written back to `req.body`.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}
