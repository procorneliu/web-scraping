import { type Request, type Response, type NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';

import { createJob, getJob } from './../jobs/jobStore';
import startPageScrape from '../services/scraperService';

import validUrl from 'valid-url';
import convertToCSV from '../services/csvService';

const startScrapingJob = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { url } = req.body;
  if (!validUrl.isUri(url)) return next(new AppError('Invalid URL', 404));

  const job = createJob();
  startPageScrape(url, job);

  res.status(200).json({
    job_id: job.job_id,
  });
});

const getJobStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const job = getJob(id);

  if (!job) return next(new AppError('Job not found!', 404));

  res.status(200).json({
    status: job.status,
  });
});

const downloadCSV = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const job = getJob(id);

  if (job.status !== 'completed' || job.result === null) {
    return next(new AppError('Job not ready or not found. Please wait and try again!', 404));
  }

  const csv = convertToCSV(job.result);

  res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
  res.setHeader('Content-Type', 'text/csv');
  res.status(200).send(csv);
});

export default { startScrapingJob, getJobStatus, downloadCSV };
