import type { Request, Response, NextFunction } from 'express';

// Helper function, try/catch block for async/await functions
// Get as argument function, that return this function, but with catch block attached
export default (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);
