import { type Request, type Response, type NextFunction } from 'express';

import validUrl from 'valid-url';

import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';

import { createJob, getJob, updateJob } from '../services/jobService';
import scrapePage from '../services/scraperService';
import convertToCSV from '../services/csvService';

// Check if job exists and return if is true
const validateJobExistence = (id: string, _: Response, next: NextFunction) => {
  // check if user provided an ID
  if (!id) {
    return next(new AppError('Missing job_Id', 400));
  }

  // Searching for job with ID
  const job = getJob(id);
  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  // If all is ok, return job
  return job;
};

// Start WEB SCRAPING process
// Returns immediately job_id and process job in background
const startScrapingJob = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { url } = req.body;

  // Checking if user provided and URL and if URL is valid
  if (!url) return next(new AppError('Please provide an URL', 404));
  if (!validUrl.isUri(url)) return next(new AppError('Invalid URL', 404));

  // Creating a new job
  const job = createJob();

  // Send job_id to user
  res.status(202).json({
    job_id: job.job_id,
  });

  try {
    // After sending job_id, change job status to 'in_progress'
    updateJob(job.job_id, { status: 'in_progress' });
    // Scrape web page asynchronous (in background)
    const result = await scrapePage(url);
    // After job is, change job status to 'compled'
    updateJob(job.job_id, { status: 'completed', result });
  } catch (err) {
    console.log('Scraping failded: ', err);
    // Change job status to 'failed'
    updateJob(job.job_id, { status: 'failed' });
  }
});

// Check job status using previous sent job_id
const getJobStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Check if job exists
  const job = validateJobExistence(req.params.id, res, next);
  if (!job) return;

  // If environment variable USING_SSE exists, remain connected and get job status when done
  if (process.env.USING_SSE) {
    // HTTP headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (job.status !== 'completed') {
      res.write(`data: status: ${job.status}\n\n`);
    }

    // Every 2 seconds
    const intervalId = setInterval(() => {
      // Get actual job status
      const refreshJob = getJob(job.job_id);

      // If job completed, send status and end connection
      if (refreshJob.status === 'completed') {
        clearInterval(intervalId);
        res.write(`data: status: ${refreshJob.status}\n\n`);
        res.end();
      }
    }, 2000);
  } else {
    // Send job status: 'pending' | 'in_progress' | 'completed' | 'failed'
    res.status(200).json({
      status: job.status,
    });
  }
});

// Download all scrape data into a CSV file, using job_id
const downloadCSV = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Check if job exists
  const job = validateJobExistence(req.params.id, res, next);
  if (!job) return;

  // Verifying job status, to see if completed
  if (job.status !== 'completed' || !job.result) {
    return next(new AppError('Job not ready or not found. Please wait and try again!', 404));
  }

  // depending on what information was found, set custom fields name for a CSV better formatting
  const fields = Object.keys(job.result[0]);

  // Convert JSON data to CSV
  const csv = convertToCSV(job.result, fields);

  // Setting HTTP response headers, for CSV file
  // CSV file name: products.csv
  res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
  res.setHeader('Content-Type', 'text/csv');

  // Sending CSV
  res.status(200).send(csv);
});

export default { startScrapingJob, getJobStatus, downloadCSV };
