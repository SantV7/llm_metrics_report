import { MongoClient, type Collection } from 'mongodb';

export interface UserDocument {
  username: string;
  email: string;
  passwordHash: string;
  birthDate: string;
  gender: string;
}

let mongoClient: MongoClient | undefined;

export const getUsersCollection = async (): Promise<Collection<UserDocument>> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured.');

  mongoClient ??= new MongoClient(uri);
  await mongoClient.connect();
  const databaseName = process.env.MONGODB_DB;
  const database = databaseName ? mongoClient.db(databaseName) : mongoClient.db();
  return database.collection<UserDocument>('users');
};