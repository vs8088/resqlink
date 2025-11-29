import { NextFunction, Request, Response } from 'express';
import { logEvent } from '../utils/log';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    logEvent('access', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt
    });
  });

  next();
};
