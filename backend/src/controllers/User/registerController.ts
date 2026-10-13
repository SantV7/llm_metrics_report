import type { RequestHandler } from 'express';
import { createAuthToken } from './JWT/jwtAuth.ts';
import { hashPassword } from './passwordAuth.ts';
import { getUsersCollection, type UserDocument } from '../../database/mongoDB.ts';
import type { RegisterCredentials } from '../../middlewares/UserAuth/registerAuth.ts';

export const registerController: RequestHandler<Record<string, string>, unknown, RegisterCredentials> =
  async (req, res) => {
    const credentials = req.body;
    const users = await getUsersCollection();
    const existingUser = await users.findOne({
      $or: [{ username: credentials.username }, { email: credentials.email }],
    });
    if (existingUser) {
      res.status(409).json({ message: 'Username ou email já cadastrado.' });
      return;
    }

    const passwordHash = await hashPassword(credentials.password);
    const user: Omit<UserDocument, '_id'> = {
      username: credentials.username,
      email: credentials.email,
      passwordHash,
      birthDate: credentials.birthDate,
      gender: credentials.gender,
    };
    const result = await users.insertOne(user);
    res.status(201).json({ token: createAuthToken(result.insertedId.toString()) });
  };
