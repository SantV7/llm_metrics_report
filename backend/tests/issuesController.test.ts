import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ObjectId } from 'mongodb';

const mockGetIssuesCollection = jest.fn<() => Promise<any>>();
const mockInsertOne = jest.fn<(issue: any) => Promise<any>>();
const mockFind = jest.fn<(filter: any) => any>();
const mockCountDocuments = jest.fn<(filter: any) => Promise<number>>();
const mockFindOne = jest.fn<(filter: any) => Promise<any>>();
const mockFindOneAndUpdate = jest.fn<(filter: any, update: any, options: any) => Promise<any>>();
const mockDeleteOne = jest.fn<(filter: any) => Promise<{ deletedCount: number }>>();

describe('issuesController', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.unstable_mockModule('../src/database/mongoDB.ts', () => ({
      getIssuesCollection: mockGetIssuesCollection,
    }));
  });

  it('creates an issue with default status and severity', async () => {
    const insertedId = new ObjectId();
    mockGetIssuesCollection.mockResolvedValue({ insertOne: mockInsertOne });
    mockInsertOne.mockResolvedValue({ insertedId });
    const { createIssueController } = await import('../src/controllers/IssuesControl/issuesController.ts');
    const req = { body: { title: 'Bug', description: 'Details' } } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    await createIssueController(req, res, jest.fn());

    expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Bug',
      description: 'Details',
      status: 'open',
      severity: 'mid',
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: insertedId.toString() }));
  });

  it('lists issues with filters and pagination', async () => {
    const issue = { _id: new ObjectId(), title: 'Bug', createdAt: new Date() };
    const cursor = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([issue]),
    };
    mockFind.mockReturnValue(cursor);
    mockCountDocuments.mockResolvedValue(11);
    mockGetIssuesCollection.mockResolvedValue({ find: mockFind, countDocuments: mockCountDocuments });
    const { listIssuesController } = await import('../src/controllers/IssuesControl/issuesController.ts');
    const req = { query: { status: 'open', severity: 'high', page: '2', limit: '5' } } as any;
    const res = { json: jest.fn() } as any;

    await listIssuesController(req, res, jest.fn());

    expect(mockFind).toHaveBeenCalledWith({ status: 'open', severity: 'high' });
    expect(cursor.skip).toHaveBeenCalledWith(5);
    expect(cursor.limit).toHaveBeenCalledWith(5);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      pagination: { page: 2, limit: 5, total: 11, pages: 3 },
    }));
  });

  it('returns 404 when an issue does not exist', async () => {
    mockFindOne.mockResolvedValue(null);
    mockGetIssuesCollection.mockResolvedValue({ findOne: mockFindOne });
    const { getIssueController } = await import('../src/controllers/IssuesControl/issuesController.ts');
    const req = { params: { id: new ObjectId().toString() } } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    await getIssueController(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates and deletes an issue', async () => {
    const id = new ObjectId();
    const updatedIssue = { _id: id, title: 'Updated bug', description: 'Details', status: 'resolved', severity: 'high' };
    mockFindOneAndUpdate.mockResolvedValue(updatedIssue);
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
    mockGetIssuesCollection.mockResolvedValue({ findOneAndUpdate: mockFindOneAndUpdate, deleteOne: mockDeleteOne });
    const { updateIssueController, deleteIssueController } = await import('../src/controllers/IssuesControl/issuesController.ts');
    const req = { params: { id: id.toString() }, body: { status: 'resolved' } } as any;
    const updateResponse = { json: jest.fn() } as any;
    const deleteResponse = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    await updateIssueController(req, updateResponse, jest.fn());
    await deleteIssueController(req, deleteResponse, jest.fn());

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: id },
      expect.objectContaining({
        $set: expect.objectContaining({ status: 'resolved', resolvedAt: expect.any(Date) }),
      }),
      { returnDocument: 'after' },
    );
    expect(updateResponse.json).toHaveBeenCalledWith(expect.objectContaining({ _id: id.toString() }));
    expect(deleteResponse.status).toHaveBeenCalledWith(204);
  });
});
