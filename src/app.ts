import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

import AppError from './utils/appError.ts';
import globalErrorHandler from './controllers/errorController.ts';
import scrapeRouter from './routes/jobRoutes.ts';

import type { Request, Response, NextFunction } from 'express';

const app = express();

// 1. MIDDLEWARES
// Enable CORS
app.use(cors());

// Parsing json
app.use(express.json());

// Help secure Express apps by setting HTTP response headers
app.use(helmet());

// HTTP request logger middleware for node.js
app.use(morgan('dev'));

// 2. ROUTES
app.use('/api/v1/scrape', scrapeRouter);

// 3. ERROR HANDLERS
// For all unknown URLs
app.all('/*splat', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
