import { ObjectId } from 'mongodb';
import type { Request, RequestHandler } from 'express';

const issueStatuses = ['open', 'in_progress', 'resolved'] as const;
const issueSeverities = ['low', 'mid', 'high'] as const;
const allowedFields = ['title', 'description', 'status', 'severity'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidText = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;

const sendInvalidBody = (res: Parameters<RequestHandler>[1]) => {
  res.status(400).json({ message: 'Informe title, description, status e severity válidos.' });
};

const validateIssueBody = (req: Request, partial: boolean) => {
  if (!isRecord(req.body)) return false;
  const body = req.body;
  const hasAllowedFields = Object.keys(body).every((field) => allowedFields.includes(field));
  const hasRequiredFields = partial
    ? Object.keys(body).length > 0
    : isValidText(body.title, 200) && isValidText(body.description, 5000);
  if (!hasAllowedFields || !hasRequiredFields) return false;
  if (body.title !== undefined && !isValidText(body.title, 200)) return false;
  if (body.description !== undefined && !isValidText(body.description, 5000)) return false;
  if (body.status !== undefined && !issueStatuses.includes(body.status as typeof issueStatuses[number])) return false;
  if (body.severity !== undefined && !issueSeverities.includes(body.severity as typeof issueSeverities[number])) return false;
  req.body = Object.fromEntries(Object.entries(body).map(([key, value]) => [
    key,
    typeof value === 'string' ? value.trim() : value,
  ]));
  return true;
};

export const issuesAuth: RequestHandler = (req, res, next) => {
  if (!validateIssueBody(req, false)) {
    sendInvalidBody(res);
    return;
  }
  next();
};

export const issueUpdateAuth: RequestHandler = (req, res, next) => {
  if (!validateIssueBody(req, true)) {
    sendInvalidBody(res);
    return;
  }
  next();
};

export const issueIdAuth: RequestHandler = (req, res, next) => {
  const id = req.params.id;
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id) || !ObjectId.isValid(id)) {
    res.status(400).json({ message: 'ID de issue inválido.' });
    return;
  }
  next();
};

export const issueQueryAuth: RequestHandler = (req, res, next) => {
  const { status, severity, page, limit } = req.query;
  const validStatus = status === undefined || (typeof status === 'string' && issueStatuses.includes(status as typeof issueStatuses[number]));
  const validSeverity = severity === undefined || (typeof severity === 'string' && issueSeverities.includes(severity as typeof issueSeverities[number]));
  const validPage = page === undefined || (
    typeof page === 'string' && /^[1-9]\d*$/.test(page) && Number.isSafeInteger(Number(page))
  );
  const validLimit = limit === undefined || (
    typeof limit === 'string' && /^[1-9]\d*$/.test(limit) && Number(limit) <= 100
  );
  if (!validStatus || !validSeverity || !validPage || !validLimit) {
    res.status(400).json({ message: 'Filtros ou paginação inválidos.' });
    return;
  }
  next();
};