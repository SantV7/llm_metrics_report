import type { RequestHandler } from 'express';
import { getIssuesCollection } from '../../database/mongoDB.ts';

interface MetricsSummary {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  averageResolutionTimeMs: number | null;
}

const emptyMetricsSummary: MetricsSummary = {
  totalIssues: 0,
  openIssues: 0,
  inProgressIssues: 0,
  resolvedIssues: 0,
  averageResolutionTimeMs: null,
};

const metricsPipeline = [
  {
    $group: {
      _id: null,
      totalIssues: { $sum: 1 },
      openIssues: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
      inProgressIssues: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
      resolvedIssues: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
      averageResolutionTimeMs: {
        $avg: {
          $cond: [
            {
              $and: [
                { $eq: ['$status', 'resolved'] },
                { $eq: [{ $type: '$createdAt' }, 'date'] },
                { $eq: [{ $type: { $ifNull: ['$resolvedAt', '$updatedAt'] } }, 'date'] },
                { $gte: [{ $ifNull: ['$resolvedAt', '$updatedAt'] }, '$createdAt'] },
              ],
            },
            { $subtract: [{ $ifNull: ['$resolvedAt', '$updatedAt'] }, '$createdAt'] },
            null,
          ],
        },
      },
    },
  },
  { $project: { _id: 0 } },
];

export const metricsController: RequestHandler = async (_req, res) => {
  const issues = await getIssuesCollection();
  const summaries = await issues.aggregate<MetricsSummary>(metricsPipeline).toArray();

  res.json(summaries[0] ?? emptyMetricsSummary);
};
