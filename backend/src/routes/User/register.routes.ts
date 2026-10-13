import { Router } from 'express';
import { registerController } from '../../controllers/User/registerController.ts';
import { registerAuth } from '../../middlewares/UserAuth/registerAuth.ts';

export const registerRouter = Router();

registerRouter.post('/register', registerAuth, registerController);