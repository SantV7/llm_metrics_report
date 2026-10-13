import type { RequestHandler } from 'express';

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  birthDate: string;
  gender: string;
}

const isValidBirthDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value
    && date <= new Date();
};

const normalizeCredentials = (body: unknown): RegisterCredentials | null => {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const input = body as Record<string, unknown>;
  if (['username', 'email', 'password', 'birthDate', 'gender']
    .some((field) => typeof input[field] !== 'string')) return null;

  const username = (input.username as string).trim();
  const email = (input.email as string).trim().toLowerCase();
  const password = input.password as string;
  const birthDate = input.birthDate as string;
  const gender = (input.gender as string).trim();
  if (!username || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!password || !gender || !isValidBirthDate(birthDate)) return null;
  return { username, email, password, birthDate, gender };
};

export const registerAuth: RequestHandler = (req, res, next) => {
  const credentials = normalizeCredentials(req.body);
  if (!credentials) {
    res.status(400).json({ message: 'Informe username, email, password, birthDate e gender válidos.' });
    return;
  }

  req.body = credentials;
  next();
};