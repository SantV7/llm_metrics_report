import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const deriveKey = (password: string, salt: Buffer): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt);
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
};

export const verifyPassword = async (
  password: string,
  passwordHash: string,
): Promise<boolean> => {
  const [saltHex, hashHex] = passwordHash.split(':');
  if (!/^[\da-f]{32}$/i.test(saltHex ?? '') || !/^[\da-f]{128}$/i.test(hashHex ?? '')) {
    return false;
  }

  const derivedKey = await deriveKey(password, Buffer.from(saltHex, 'hex'));
  return timingSafeEqual(derivedKey, Buffer.from(hashHex, 'hex'));
};
