import type { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';

// Send this error when app is in development mode
// More error details
const sendErrorDev = (err: AppError, req: Request, res: Response) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Send this error when app is in development mode
// Less error details
const sendErrorProd = (err: AppError, req: Request, res: Response) => {
  // Checking if error is from user or app side
  if (err.isOperational) {
    // user side
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // app side
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong...!',
  });
};

export default (err: AppError, req: Request, res: Response, next: NextFunction) => {
  err.statusCode ??= 500;
  err.status ??= 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(err, req, res);
  }
};
