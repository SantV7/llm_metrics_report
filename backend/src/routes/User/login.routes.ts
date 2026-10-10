
import { Router } from 'express';
import { loginController } from '../../controllers/User/loginController.ts';
import { loginAuth } from '../../middlewares/UserAuth/loginAuth.ts';

export const loginRouter = Router();

loginRouter.post('/login', loginAuth, loginController);
