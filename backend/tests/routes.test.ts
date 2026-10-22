import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Express } from 'express';
import { ObjectId } from 'mongodb';
import request from 'supertest';

const mockGetUsersCollection = jest.fn<() => Promise<any>>();
const mockGetIssuesCollection = jest.fn<() => Promise<any>>();
const mockFindUser = jest.fn<(filter: any) => Promise<any>>();
const mockInsertUser = jest.fn<(user: any) => Promise<any>>();
const mockHashPassword = jest.fn<(password: string) => Promise<string>>();
const mockVerifyPassword = jest.fn<(password: string, hash: string) => Promise<boolean>>();
const mockInsertIssue = jest.fn<(issue: any) => Promise<any>>();
const mockFindIssues = jest.fn<(filter: any) => any>();
const mockCountIssues = jest.fn<(filter: any) => Promise<number>>();
const mockFindIssue = jest.fn<(filter: any) => Promise<any>>();
const mockUpdateIssue = jest.fn<(filter: any, update: any, options: any) => Promise<any>>();
const mockDeleteIssue = jest.fn<(filter: any) => Promise<{ deletedCount: number }>>();
const mockAggregateIssues = jest.fn<(pipeline: any[]) => any>();

const previousJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'routes-test-secret';

describe('HTTP routes', () => {
  let app: Express;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    mockGetUsersCollection.mockReset();
    mockGetIssuesCollection.mockReset();
    mockFindUser.mockReset();
    mockInsertUser.mockReset();
    mockHashPassword.mockReset();
    mockVerifyPassword.mockReset();
    mockInsertIssue.mockReset();
    mockFindIssues.mockReset();
    mockCountIssues.mockReset();
    mockFindIssue.mockReset();
    mockUpdateIssue.mockReset();
    mockDeleteIssue.mockReset();
    mockAggregateIssues.mockReset();

    jest.unstable_mockModule('../src/database/mongoDB.ts', () => ({
      getUsersCollection: mockGetUsersCollection,
      getIssuesCollection: mockGetIssuesCollection,
    }));
    jest.unstable_mockModule('../src/controllers/User/passwordAuth.ts', () => ({
      hashPassword: mockHashPassword,
      verifyPassword: mockVerifyPassword,
    }));

    mockGetUsersCollection.mockResolvedValue({
      findOne: mockFindUser,
      insertOne: mockInsertUser,
    });
    mockGetIssuesCollection.mockResolvedValue({
      insertOne: mockInsertIssue,
      find: mockFindIssues,
      countDocuments: mockCountIssues,
      findOne: mockFindIssue,
      findOneAndUpdate: mockUpdateIssue,
      deleteOne: mockDeleteIssue,
      aggregate: mockAggregateIssues,
    });
    mockFindUser.mockResolvedValue(null);
    mockInsertUser.mockResolvedValue({ insertedId: new ObjectId() });
    mockHashPassword.mockResolvedValue('hashed-password');
    mockVerifyPassword.mockResolvedValue(true);
    mockInsertIssue.mockResolvedValue({ insertedId: new ObjectId() });
    mockCountIssues.mockResolvedValue(0);
    mockFindIssue.mockResolvedValue(null);
    mockUpdateIssue.mockResolvedValue(null);
    mockDeleteIssue.mockResolvedValue({ deletedCount: 0 });
    mockAggregateIssues.mockReturnValue({
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    });
    mockFindIssues.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    });

    ({ app } = await import('../src/app.ts'));
  });

  afterAll(() => {
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  });

  it('registers a user and returns a token', async () => {
    const response = await request(app).post('/user/register').send({
      username: 'joao',
      email: 'joao@example.com',
      password: 'secret123',
      birthDate: '1995-06-15',
      gender: 'masculino',
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(mockInsertUser).toHaveBeenCalledWith(expect.objectContaining({
      username: 'joao',
      email: 'joao@example.com',
      passwordHash: 'hashed-password',
    }));
  });

  it('rejects invalid registration input before accessing the database', async () => {
    const response = await request(app).post('/user/register').send({ email: 'invalid' });

    expect(response.status).toBe(400);
    expect(mockGetUsersCollection).not.toHaveBeenCalled();
  });

  it('logs in with valid credentials and rejects invalid credentials', async () => {
    const user = {
      _id: new ObjectId(),
      username: 'joao',
      email: 'joao@example.com',
      passwordHash: 'hashed-password',
    };
    mockFindUser.mockResolvedValueOnce(user);

    const success = await request(app).post('/user/login').send({
      email: 'JOAO@example.com',
      password: 'secret123',
    });
    const failure = await request(app).post('/user/login').send({
      email: 'joao@example.com',
      password: 'wrong-password',
    });

    expect(success.status).toBe(200);
    expect(success.body.token).toEqual(expect.any(String));
    expect(failure.status).toBe(401);
    expect(failure.body).toEqual({ message: 'Usuário ou senha inválidos.' });
  });

  it('requires a token on every issues endpoint', async () => {
    const response = await request(app).get('/api/issues');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Token ausente ou inválido.' });
    expect(mockGetIssuesCollection).not.toHaveBeenCalled();
  });

  it('protects metrics summary and returns consolidated global metrics', async () => {
    const unauthorized = await request(app).get('/api/metrics/summary');
    const { createAuthToken } = await import('../src/controllers/User/JWT/jwtAuth.ts');
    const summary = {
      totalIssues: 8,
      openIssues: 3,
      inProgressIssues: 2,
      resolvedIssues: 3,
      averageResolutionTimeMs: 3600000,
    };
    mockAggregateIssues.mockReturnValue({
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([summary]),
    });

    const response = await request(app)
      .get('/api/metrics/summary')
      .set('Authorization', `Bearer ${createAuthToken('user-1')}`);

    expect(unauthorized.status).toBe(401);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(summary);
    expect(mockAggregateIssues).toHaveBeenCalledTimes(1);
  });

  it('returns empty metrics when there are no issues', async () => {
    const { createAuthToken } = await import('../src/controllers/User/JWT/jwtAuth.ts');
    const response = await request(app)
      .get('/api/metrics/summary')
      .set('Authorization', `Bearer ${createAuthToken('user-1')}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalIssues: 0,
      openIssues: 0,
      inProgressIssues: 0,
      resolvedIssues: 0,
      averageResolutionTimeMs: null,
    });
  });

  it('creates and lists issues with a valid token', async () => {
    const { createAuthToken } = await import('../src/controllers/User/JWT/jwtAuth.ts');
    const authorization = `Bearer ${createAuthToken('user-1')}`;
    const created = await request(app)
      .post('/api/issues')
      .set('Authorization', authorization)
      .send({ title: 'Bug', description: 'Details' });
    const listed = await request(app)
      .get('/api/issues?page=1&limit=20')
      .set('Authorization', authorization);

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: 'Bug', description: 'Details', status: 'open', severity: 'mid' });
    expect(listed.status).toBe(200);
    expect(listed.body).toMatchObject({
      issues: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
  });

  it('rejects invalid issue input, filters, and IDs', async () => {
    const { createAuthToken } = await import('../src/controllers/User/JWT/jwtAuth.ts');
    const authorization = `Bearer ${createAuthToken('user-1')}`;
    const invalidBody = await request(app)
      .post('/api/issues')
      .set('Authorization', authorization)
      .send({ title: '', description: 'Details' });
    const invalidQuery = await request(app)
      .get('/api/issues?page=0')
      .set('Authorization', authorization);
    const invalidId = await request(app)
      .get('/api/issues/not-an-object-id')
      .set('Authorization', authorization);

    expect(invalidBody.status).toBe(400);
    expect(invalidQuery.status).toBe(400);
    expect(invalidId.status).toBe(400);
    expect(mockInsertIssue).not.toHaveBeenCalled();
    expect(mockFindIssue).not.toHaveBeenCalled();
  });

  it('returns an existing issue by ID', async () => {
    const { createAuthToken } = await import('../src/controllers/User/JWT/jwtAuth.ts');
    const authorization = `Bearer ${createAuthToken('user-1')}`;
    const id = new ObjectId();
    mockFindIssue.mockResolvedValue({
      _id: id,
      title: 'Bug',
      description: 'Details',
      status: 'open',
      severity: 'mid',
    });

    const response = await request(app)
      .get(`/api/issues/${id}`)
      .set('Authorization', authorization);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ _id: id.toString(), title: 'Bug' });
  });

  it('returns 404 for missing issues on read, update, and delete', async () => {
    const { createAuthToken } = await import('../src/controllers/User/JWT/jwtAuth.ts');
    const authorization = `Bearer ${createAuthToken('user-1')}`;
    const id = new ObjectId().toString();
    const read = await request(app).get(`/api/issues/${id}`).set('Authorization', authorization);
    const update = await request(app)
      .patch(`/api/issues/${id}`)
      .set('Authorization', authorization)
      .send({ status: 'resolved' });
    const remove = await request(app).delete(`/api/issues/${id}`).set('Authorization', authorization);

    expect(read.status).toBe(404);
    expect(update.status).toBe(404);
    expect(remove.status).toBe(404);
  });

  it('updates and deletes existing issues', async () => {
    const { createAuthToken } = await import('../src/controllers/User/JWT/jwtAuth.ts');
    const authorization = `Bearer ${createAuthToken('user-1')}`;
    const id = new ObjectId();
    mockUpdateIssue.mockResolvedValue({
      _id: id,
      title: 'Bug',
      description: 'Details',
      status: 'resolved',
      severity: 'mid',
    });
    mockDeleteIssue.mockResolvedValue({ deletedCount: 1 });

    const updated = await request(app)
      .patch(`/api/issues/${id}`)
      .set('Authorization', authorization)
      .send({ status: 'resolved' });
    const removed = await request(app)
      .delete(`/api/issues/${id}`)
      .set('Authorization', authorization);

    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('resolved');
    expect(removed.status).toBe(204);
  });
});
