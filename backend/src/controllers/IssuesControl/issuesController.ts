import { ObjectId, type Filter } from 'mongodb';
import type { RequestHandler } from 'express';
import { getIssuesCollection, type IssueDocument } from '../../database/mongoDB.ts';

type IssueInput = Pick<IssueDocument, 'title' | 'description' | 'status' | 'severity'>;
type CreateIssueInput = Pick<IssueInput, 'title' | 'description'> & Partial<Pick<IssueInput, 'status' | 'severity'>>;
type UpdateIssueInput = Partial<IssueInput>;

const toIssueResponse = (issue: IssueDocument & { _id: ObjectId }) => ({
  ...issue,
  _id: issue._id.toString(),
});

const getIssueId = (id: string) => new ObjectId(id);

export const createIssueController: RequestHandler<Record<string, never>, unknown, CreateIssueInput> = async (req, res) => {
  const input = req.body;
  const now = new Date();
  const issue: IssueDocument = {
    title: input.title,
    description: input.description,
    status: input.status ?? 'open',
    severity: input.severity ?? 'mid',
    createdAt: now,
    updatedAt: now,
  };
  const result = await (await getIssuesCollection()).insertOne(issue);
  res.status(201).json(toIssueResponse({ ...issue, _id: result.insertedId }));
};

export const listIssuesController: RequestHandler = async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const filter: Filter<IssueDocument> = {};
  if (typeof req.query.status === 'string') filter.status = req.query.status as IssueDocument['status'];
  if (typeof req.query.severity === 'string') filter.severity = req.query.severity as IssueDocument['severity'];
  const issues = await getIssuesCollection();
  const [items, total] = await Promise.all([
    issues.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    issues.countDocuments(filter),
  ]);
  res.json({ issues: items.map(toIssueResponse), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

export const getIssueController: RequestHandler<{ id: string }> = async (req, res) => {
  const issue = await (await getIssuesCollection()).findOne({ _id: getIssueId(req.params.id) });
  if (!issue) {
    res.status(404).json({ message: 'Issue não encontrada.' });
    return;
  }
  res.json(toIssueResponse(issue));
};

export const updateIssueController: RequestHandler<{ id: string }, unknown, UpdateIssueInput> = async (req, res) => {
  const issues = await getIssuesCollection();
  const issue = await issues.findOneAndUpdate(
    { _id: getIssueId(req.params.id) },
    { $set: { ...req.body, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!issue) {
    res.status(404).json({ message: 'Issue não encontrada.' });
    return;
  }
  res.json(toIssueResponse(issue));
};

export const deleteIssueController: RequestHandler<{ id: string }> = async (req, res) => {
  const result = await (await getIssuesCollection()).deleteOne({ _id: getIssueId(req.params.id) });
  if (result.deletedCount === 0) {
    res.status(404).json({ message: 'Issue não encontrada.' });
    return;
  }
  res.status(204).send();
};