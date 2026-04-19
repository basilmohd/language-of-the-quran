import { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 as uuid } from 'uuid';
import type { ApiResponse } from '@org/api-types';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next);
}

function meta() {
  return { version: '1.0', requestId: uuid() };
}

export function ok<T>(res: Response, data: T, status = 200): void {
  const body: ApiResponse<T> = { data, meta: meta(), error: null };
  res.status(status).json(body);
}

export function fail(res: Response, code: string, message: string, status = 400): void {
  const body: ApiResponse<never> = { data: null, meta: meta(), error: { code, message } };
  res.status(status).json(body);
}
