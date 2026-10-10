import type { RequestHandler } from 'express';

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
}

const normalizeLoginCredentials = (body: unknown): LoginCredentials | null => {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;

  const input = body as Record<string, unknown>;

  if (input.username !== undefined && typeof input.username !== 'string') return null;

  if (input.email !== undefined && typeof input.email !== 'string') return null;

  if (typeof input.password !== 'string' || !input.password) return null;

  const username = typeof input.username === 'string' ? input.username.trim() : '';
  
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!username && !email) return null;
  return { ...(username && { username }), ...(email && { email }), password: input.password };
};


export const loginAuth: RequestHandler = (req, res, next) => {
  const credentials = normalizeLoginCredentials(req.body);
  if (!credentials) {
    res.status(400).json({ message: 'Informe usuário ou email e senha.' });
    return;
  };

  req.body = credentials;
  next();
};
