import { v4 as uuidv4 } from 'uuid';

// Declaring INTERFACES and TYPES for Typescript
type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export type ProductField = {
  [key: string]: string;
};

export interface Job {
  job_id: string;
  status: JobStatus;
  result: ProductField[] | null;
}

// VARIABLE where all jobs will be stored
const jobs: Record<string, Job> = {};

// Creating a new job
export const createJob = () => {
  // generate a unique random job_id, using UUIDV4
  const id = uuidv4();

  // New job in pending status
  const job: Job = {
    job_id: id,
    status: 'pending',
    result: null,
  };

  // Saving new job into storing variable
  jobs[id] = job;

  return job;
};

// Return job, find by job_id
export const getJob = (id: string): Job => {
  return jobs[id];
};

// Updating existing job, with new data
export const updateJob = (id: string, updates: {}): void => {
  if (!jobs[id]) return;
  jobs[id] = { ...jobs[id], ...updates };
};
