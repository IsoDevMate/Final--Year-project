import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from './response.utils';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return ResponseUtil.error(res, err.statusCode, err.message);
  }
  return ResponseUtil.error(res, 500, 'Internal server error');
};

export const notFoundHandler = (req: Request, res: Response) => {
  return ResponseUtil.error(res, 404, `Route ${req.originalUrl} not found`);
};
