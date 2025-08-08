// Helper function for defining error easier
export default class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'error' : 'fail';
    // define all this errors as operational,
    this.isOperational = true;

    // get full path where error was produced
    Error.captureStackTrace(this, this.constructor);
  }
}
