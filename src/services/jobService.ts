import { v4 as uuidv4 } from 'uuid';

export type ProductField = {
  [key: string]: string;
};
type ProductEntry = ProductField;

type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Job {
  job_id: string;
  status: JobStatus;
  result: ProductEntry[] | null;
}

const jobs: Record<string, Job> = {};

export const createJob = () => {
  const id = uuidv4();

  const job: Job = {
    job_id: id,
    status: 'pending',
    result: null,
  };

  jobs[id] = job;

  return job;
};

export const getJob = (id: string): Job => {
  return jobs[id];
};

export const updateJob = (id: string, updates: {}): void => {
  if (!jobs[id]) return;
  jobs[id] = { ...jobs[id], ...updates };
};
