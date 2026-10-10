import 'dotenv/config';
import express, { type Express, type Request, type Response } from 'express';

export const app: Express = express();
app.use(express.json());
app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(3000);