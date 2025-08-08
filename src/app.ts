import express, { json } from 'express';
import AppError from './utils/appError.ts';
import globalErrorHandler from './controllers/errorController.ts';
import scrapeRouter from './routes/jobRoutes.ts';
import type { Request, Response, NextFunction } from 'express';

const app = express();

app.use(express.json());

app.use('/api/v1/scrape', scrapeRouter);

app.all('/*splat', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

export default app;
