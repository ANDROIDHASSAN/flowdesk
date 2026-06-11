import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { unauthorized } from '../utils/errors';

export interface AuthedRequest extends Request {
  userId?: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '30d' });
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(unauthorized('Missing token'));
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as jwt.JwtPayload;
    if (!payload.sub) return next(unauthorized('Invalid token'));
    req.userId = String(payload.sub);
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}

/** Guard for the /api/automation/* endpoints called by n8n / external cron */
export function requireServiceToken(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers['x-service-token'];
  if (token !== env.SERVICE_TOKEN) return next(unauthorized('Invalid service token'));
  next();
}
