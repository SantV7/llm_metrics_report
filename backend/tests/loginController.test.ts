import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockFindOne = jest.fn() as jest.MockedFunction<(query: any) => Promise<any>>;
const mockGetUsersCollection = jest.fn() as jest.MockedFunction<() => Promise<any>>;
const mockVerifyPassword = jest.fn() as jest.MockedFunction<
  (password: string, hash: string) => Promise<boolean>
>;
const mockCreateAuthToken = jest.fn() as jest.MockedFunction<(userId: string) => string>;

describe('loginController', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockFindOne.mockReset();
    mockGetUsersCollection.mockReset();
    mockVerifyPassword.mockReset();
    mockCreateAuthToken.mockReset();

    jest.unstable_mockModule('../src/database/mongoDB.ts', () => ({
      getUsersCollection: mockGetUsersCollection,
    }));

    jest.unstable_mockModule('../src/controllers/User/passwordAuth.ts', () => ({
      verifyPassword: mockVerifyPassword,
    }));

    jest.unstable_mockModule('../src/controllers/User/JWT/jwtAuth.ts', () => ({
      createAuthToken: mockCreateAuthToken,
    }));
  });

  it('should return 401 when the password is invalid', async () => {
    mockGetUsersCollection.mockResolvedValue({ findOne: mockFindOne });
    mockFindOne.mockResolvedValue({
      _id: { toString: () => 'user-1' },
      username: 'joao',
      email: 'joao@example.com',
      passwordHash: 'hashed-password',
    });
    mockVerifyPassword.mockResolvedValue(false);

    const { loginController } = await import('../src/controllers/User/loginController.ts');

    const req = { body: { username: 'joao', password: 'wrong-password' } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await loginController(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Usuário ou senha inválidos.' });
    expect(mockCreateAuthToken).not.toHaveBeenCalled();
  });

  it('should return 200 and a token when login succeeds', async () => {
    mockGetUsersCollection.mockResolvedValue({ findOne: mockFindOne });
    mockFindOne.mockResolvedValue({
      _id: { toString: () => 'user-1' },
      username: 'joao',
      email: 'joao@example.com',
      passwordHash: 'hashed-password',
    });
    mockVerifyPassword.mockResolvedValue(true);
    mockCreateAuthToken.mockReturnValue('fake.jwt.token');

    const { loginController } = await import('../src/controllers/User/loginController.ts');

    const req = { body: { email: 'joao@example.com', password: 'right-password' } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await loginController(req, res, jest.fn());

    expect(mockFindOne).toHaveBeenCalledWith({
      $and: [{ email: 'joao@example.com' }],
    });
    expect(mockCreateAuthToken).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: 'fake.jwt.token' });
  });
});
