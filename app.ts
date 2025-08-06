import express from 'express';
import AppError from './utils/appError.ts';
import globalErrorHandler from './controllers/errorController.ts';
import type { Request, Response, NextFunction } from 'express';

const app = express();

app.all('/*splat', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

export default app;
