import { describe, expect, it, jest } from '@jest/globals';
import { loginAuth } from '../src/middlewares/UserAuth/loginAuth.ts';

describe('loginAuth', () => {
  it('should reject an empty body', () => {
    const req = { body: {} } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    loginAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Informe usuário ou email e senha.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should accept valid credentials and normalize the payload', () => {
    const req = {
      body: {
        email: '  USER@EXAMPLE.COM  ',
        password: 'secret123',
      },
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    loginAuth(req, res, next);

    expect(req.body).toEqual({
      email: 'user@example.com',
      password: 'secret123',
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
