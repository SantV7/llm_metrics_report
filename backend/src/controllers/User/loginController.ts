import type { RequestHandler } from 'express';
import type { Filter } from 'mongodb';
import { createAuthToken } from './JWT/jwtAuth.ts';
import { getUsersCollection, type UserDocument } from '../../database/mongoDB.ts';
import { verifyPassword } from './passwordAuth.ts';

interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
}

const parseLoginCredentials = (body: unknown): LoginCredentials | null => {
  if (typeof body !== 'object' || body === null) return null;
  const input = body as Record<string, unknown>;
  if (input.username !== undefined && typeof input.username !== 'string') return null;
  if (input.email !== undefined && typeof input.email !== 'string') return null;
  if (typeof input.password !== 'string' || !input.password) return null;

  const username = typeof input.username === 'string' ? input.username.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!username && !email) return null;
  return { ...(username && { username }), ...(email && { email }), password: input.password };
};

const createUserFilter = (credentials: LoginCredentials): Filter<UserDocument> => {
  const filters: Filter<UserDocument>[] = [];
  if (credentials.username) filters.push({ username: credentials.username });
  if (credentials.email) filters.push({ email: credentials.email });
  return { $and: filters };
};

export const loginController: RequestHandler = async (req, res) => {
  const credentials = parseLoginCredentials(req.body);
  if (!credentials) {
    res.status(400).json({ message: 'Informe usuário ou email e senha.' });
    return;
  }

  const users = await getUsersCollection();
  const user = await users.findOne(createUserFilter(credentials));
  if (!user || !(await verifyPassword(credentials.password, user.passwordHash))) {
    res.status(401).json({ message: 'Usuário ou senha inválidos.' });
    return;
  }

  res.status(200).json({ token: createAuthToken(user._id.toString()) });
};
