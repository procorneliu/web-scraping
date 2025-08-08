import { type Request, type Response, type NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';

import { createJob, getJob, updateJob } from '../services/jobService';
import scrapePage from '../services/scraperService';
import convertToCSV from '../services/csvService';

import validUrl from 'valid-url';

const validateJobExistence = (id: string, res: Response, next: NextFunction) => {
  if (!id) {
    return next(new AppError('Missing job_Id', 400));
  }

  const job = getJob(id);
  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  return job;
};

const startScrapingJob = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { url } = req.body;

  if (!url) return next(new AppError('Please provide an URL', 404));
  if (!validUrl.isUri(url)) return next(new AppError('Invalid URL', 404));

  const job = createJob();

  res.status(202).json({
    job_id: job.job_id,
  });

  try {
    updateJob(job.job_id, { status: 'in_progress' });
    const result = await scrapePage(url);
    updateJob(job.job_id, { status: 'completed', result });
  } catch (err) {
    console.log('Scraping failded: ', err);
    updateJob(job.job_id, { status: 'failed' });
  }
});

const getJobStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const job = validateJobExistence(req.params.id, res, next);
  if (!job) return;

  res.status(200).json({
    status: job.status,
  });
});

const downloadCSV = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const job = validateJobExistence(req.params.id, res, next);
  if (!job) return;

  if (job.status !== 'completed' || !job.result) {
    return next(new AppError('Job not ready or not found. Please wait and try again!', 404));
  }

  const csv = convertToCSV(job.result);

  res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
  res.setHeader('Content-Type', 'text/csv');
  res.status(200).send(csv);
});

export default { startScrapingJob, getJobStatus, downloadCSV };
