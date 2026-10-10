import type { RequestHandler } from 'express';
import type { Filter } from 'mongodb';
import { createAuthToken } from './JWT/jwtAuth.ts';
import { getUsersCollection, type UserDocument } from '../../database/mongoDB.ts';
import { verifyPassword } from './passwordAuth.ts';
import type { LoginCredentials } from '../../middlewares/UserAuth/loginAuth.ts';

const createUserFilter = (credentials: LoginCredentials): Filter<UserDocument> => {
  const filters: Filter<UserDocument>[] = [];
  if (credentials.username) filters.push({ username: credentials.username });
  if (credentials.email) filters.push({ email: credentials.email });
  return { $and: filters };
};

export const loginController: RequestHandler<Record<string, string>, unknown, LoginCredentials> = async (req, res) => {
  const credentials = req.body;
  const users = await getUsersCollection();
  const user = await users.findOne(createUserFilter(credentials));
  if (!user || !(await verifyPassword(credentials.password, user.passwordHash))) {
    res.status(401).json({ message: 'Usuário ou senha inválidos.' });
    return;
  };

  res.status(200).json({ token: createAuthToken(user._id.toString()) });
};
