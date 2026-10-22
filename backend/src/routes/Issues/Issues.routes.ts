import { Router } from 'express';
import { createIssueController, deleteIssueController, getIssueController, listIssuesController, updateIssueController } from '../../controllers/IssuesControl/issuesController.ts';
import { issueIdAuth, issueQueryAuth, issueUpdateAuth, issuesAuth } from '../../middlewares/IssuesAuth/issuesAuth.ts';
import { tokenAuth } from '../../middlewares/UserAuth/tokenAuth.ts';

export const issuesRouter = Router();

issuesRouter.use(tokenAuth);
issuesRouter.post('/', issuesAuth, createIssueController);
issuesRouter.get('/', issueQueryAuth, listIssuesController);
issuesRouter.get('/:id', issueIdAuth, getIssueController);
issuesRouter.patch('/:id', issueIdAuth, issueUpdateAuth, updateIssueController);
issuesRouter.delete('/:id', issueIdAuth, deleteIssueController);
