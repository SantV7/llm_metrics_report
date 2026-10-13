import 'dotenv/config';
import express, { type Express, type Request, type Response } from 'express';
import { loginRouter } from './routes/User/login.routes.ts';
import { registerRouter } from './routes/User/register.routes.ts';

export const app: Express = express();
app.use(express.json());

app.use('/user', loginRouter);
app.use('/user', registerRouter);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});