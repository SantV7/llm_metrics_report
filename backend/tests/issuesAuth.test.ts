import { describe, expect, it, jest } from '@jest/globals';
import {
  issueIdAuth,
  issueQueryAuth,
  issueUpdateAuth,
  issuesAuth,
} from '../src/middlewares/IssuesAuth/issuesAuth.ts';

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('issuesAuth', () => {
  it('should accept and normalize a valid issue payload', () => {
    const req = {
      body: { title: '  Bug  ', description: '  Details  ', severity: 'high' },
    } as any;
    const res = createResponse() as any;
    const next = jest.fn();

    issuesAuth(req, res, next);

    expect(req.body).toEqual({ title: 'Bug', description: 'Details', severity: 'high' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject unsupported fields and invalid enum values', () => {
    const req = { body: { title: 'Bug', description: 'Details', type: 'high' } } as any;
    const res = createResponse() as any;
    const next = jest.fn();

    issuesAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject an empty partial update', () => {
    const req = { body: {} } as any;
    const res = createResponse() as any;
    const next = jest.fn();

    issueUpdateAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should validate MongoDB issue IDs', () => {
    const req = { params: { id: 'not-an-object-id' } } as any;
    const res = createResponse() as any;
    const next = jest.fn();

    issueIdAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject page sizes above the maximum', () => {
    const req = { query: { page: '1', limit: '101' } } as any;
    const res = createResponse() as any;
    const next = jest.fn();

    issueQueryAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});