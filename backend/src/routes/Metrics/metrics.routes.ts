import { Router } from 'express';
import { metricsController } from '../../controllers/Metrics/metricsController.ts';
import { tokenAuth } from '../../middlewares/UserAuth/tokenAuth.ts';

export const metricsRouter = Router();

metricsRouter.get('/summary', tokenAuth, metricsController);