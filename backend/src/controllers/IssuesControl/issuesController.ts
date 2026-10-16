import type { Request, Response, NextFunction } from 'express';

type IssuesType = "low" | "mid" | "high";

interface IssuesData {
    name: string;
    type: IssuesType
};

export const issuesController = (req: Request, res: Response, next: NextFunction) => {
    const { name, type, warning } = req.body as IssuesData;

    

};