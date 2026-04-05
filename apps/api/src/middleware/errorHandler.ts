import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  console.error('[API Error]', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({
    data: null,
    meta: { version: '1.0', requestId: uuid() },
    error: { code: 'INTERNAL_ERROR', message },
  });
}
