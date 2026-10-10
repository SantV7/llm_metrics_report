import jwt from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured.');
  return secret;
};

export const createAuthToken = (userId: string): string =>
  jwt.sign({}, getJwtSecret(), { subject: userId, expiresIn: '1h' });

export const verifyAuthToken = (token: string): string | null => {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    return typeof payload === 'object' && typeof payload.sub === 'string'
      ? payload.sub
      : null;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return null;
    throw error;
  }
};
