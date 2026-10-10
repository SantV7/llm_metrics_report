
import { Router } from 'express';
import { loginController } from '../../controllers/User/loginController.ts';

export const loginRouter = Router();

loginRouter.post('/login', loginController);
