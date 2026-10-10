import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createAuthToken, verifyAuthToken } from '../src/controllers/User/JWT/jwtAuth.ts';
import { tokenAuth } from '../src/middlewares/UserAuth/tokenAuth.ts';

describe('JWT auth', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    jest.clearAllMocks();
  });

  it('should create a valid JWT token for a user', () => {
    const token = createAuthToken('user-123');

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
    expect(verifyAuthToken(token)).toBe('user-123');
  });

  it('should reject an invalid token', () => {
    expect(verifyAuthToken('token.invalid')).toBeNull();
    expect(verifyAuthToken('')).toBeNull();
  });

  it('should throw when JWT_SECRET is not configured', () => {
    delete process.env.JWT_SECRET;

    expect(() => createAuthToken('user-123')).toThrow('JWT_SECRET is not configured.');
  });

  it('tokenAuth should accept a valid Bearer token and attach the user id', () => {
    const token = createAuthToken('user-456');
    const req = {
      get: jest.fn().mockReturnValue(`Bearer ${token}`),
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    tokenAuth(req, res, next);

    expect(req.userId).toBe('user-456');
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('tokenAuth should reject a missing or invalid token', () => {
    const req = {
      get: jest.fn().mockReturnValue('Bearer invalid.token.here'),
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    tokenAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token ausente ou inválido.' });
    expect(next).not.toHaveBeenCalled();
  });
});
