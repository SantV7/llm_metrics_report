import { MongoClient, type Collection } from 'mongodb';

export interface UserDocument {
  username: string;
  email: string;
  passwordHash: string;
  birthDate: string;
  gender: string;
}

export interface IssueDocument {
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  severity: 'low' | 'mid' | 'high';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

let mongoClient: MongoClient | undefined;

const getDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured.');

  mongoClient ??= new MongoClient(uri);
  await mongoClient.connect();
  const databaseName = process.env.MONGODB_DB;
  return databaseName ? mongoClient.db(databaseName) : mongoClient.db();
};

export const getUsersCollection = async (): Promise<Collection<UserDocument>> =>
  (await getDatabase()).collection<UserDocument>('users');

export const getIssuesCollection = async (): Promise<Collection<IssueDocument>> =>
  (await getDatabase()).collection<IssueDocument>('issues');