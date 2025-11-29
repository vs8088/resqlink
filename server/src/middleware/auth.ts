import { NextFunction, Request, Response } from 'express';
import { API_AUTH_REQUIRED, API_SHARED_SECRET } from '../config';
import { logEvent } from '../utils/log';

const parsePresentedToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string') return apiKeyHeader;
  if (Array.isArray(apiKeyHeader)) return apiKeyHeader[0];
  return undefined;
};

export const requireApiSecret = (req: Request, res: Response, next: NextFunction) => {
  const provided = parsePresentedToken(req);

  if (!API_SHARED_SECRET) {
    logEvent('auth:error', {
      path: req.originalUrl,
      reason: 'missing_shared_secret'
    });

    if (API_AUTH_REQUIRED) {
      return res.status(503).json({ error: 'Server auth not configured' });
    }

    return next();
  }

  if (!provided) {
    logEvent('auth:missing_token', {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    if (API_AUTH_REQUIRED) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return next();
  }

  if (provided !== API_SHARED_SECRET) {
    logEvent('auth:unauthorized', {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      hasToken: Boolean(provided)
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
};
