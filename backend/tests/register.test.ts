import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { registerAuth } from '../src/middlewares/UserAuth/registerAuth.ts';

const validPayload = {
  username: 'joao',
  email: 'joao@example.com',
  password: 'secret123',
  birthDate: '1995-06-15',
  gender: 'masculino',
};

describe('registerAuth', () => {
  const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  });

  it('should reject an invalid birth date', () => {
    const req = { body: { ...validPayload, birthDate: '2030-01-01' } } as any;
    const res = createResponse() as any;
    const next = jest.fn();

    registerAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should normalize username and email and pass valid credentials', () => {
    const req = {
      body: { ...validPayload, username: ' joao ', email: ' JOAO@EXAMPLE.COM ' },
    } as any;
    const res = createResponse() as any;
    const next = jest.fn();

    registerAuth(req, res, next);

    expect(req.body).toEqual({ ...validPayload, email: 'joao@example.com' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

const mockFindOne = jest.fn() as jest.MockedFunction<(query: any) => Promise<any>>;
const mockInsertOne = jest.fn() as jest.MockedFunction<(user: any) => Promise<any>>;
const mockGetUsersCollection = jest.fn() as jest.MockedFunction<() => Promise<any>>;
const mockHashPassword = jest.fn() as jest.MockedFunction<(password: string) => Promise<string>>;
const mockCreateAuthToken = jest.fn() as jest.MockedFunction<(userId: string) => string>;

describe('registerController', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockFindOne.mockReset();
    mockInsertOne.mockReset();
    mockGetUsersCollection.mockReset();
    mockHashPassword.mockReset();
    mockCreateAuthToken.mockReset();
    jest.unstable_mockModule('../src/database/mongoDB.ts', () => ({
      getUsersCollection: mockGetUsersCollection,
    }));
    jest.unstable_mockModule('../src/controllers/User/passwordAuth.ts', () => ({
      hashPassword: mockHashPassword,
    }));
    jest.unstable_mockModule('../src/controllers/User/JWT/jwtAuth.ts', () => ({
      createAuthToken: mockCreateAuthToken,
    }));
  });

  it('should reject an already registered username or email', async () => {
    mockGetUsersCollection.mockResolvedValue({ findOne: mockFindOne });
    mockFindOne.mockResolvedValue({ username: 'joao' });
    const { registerController } = await import('../src/controllers/User/registerController.ts');
    const req = { body: validPayload } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    await registerController(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  it('should hash the password, save the profile and return a token', async () => {
    mockGetUsersCollection.mockResolvedValue({ findOne: mockFindOne, insertOne: mockInsertOne });
    mockFindOne.mockResolvedValue(null);
    mockHashPassword.mockResolvedValue('secure-hash');
    mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'user-1' } });
    mockCreateAuthToken.mockReturnValue('fake.jwt.token');
    const { registerController } = await import('../src/controllers/User/registerController.ts');
    const req = { body: validPayload } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    await registerController(req, res, jest.fn());

    expect(mockHashPassword).toHaveBeenCalledWith(validPayload.password);
    expect(mockInsertOne).toHaveBeenCalledWith({
      username: 'joao',
      email: 'joao@example.com',
      passwordHash: 'secure-hash',
      birthDate: '1995-06-15',
      gender: 'masculino',
    });
    expect(mockCreateAuthToken).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ token: 'fake.jwt.token' });
  });
});