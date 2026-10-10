import type { RequestHandler } from 'express';
import { verifyAuthToken } from '../../controllers/User/JWT/jwtAuth.ts';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const loginAuth: RequestHandler = (req, res, next) => {
  const authorization = req.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const userId = token ? verifyAuthToken(token) : null;
  if (!userId) {
    res.status(401).json({ message: 'Token ausente ou inválido.' });
    return;
  }

  req.userId = userId;
  next();
};