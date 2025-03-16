import { Response } from 'express';
import { ApiResponse } from '../interfaces/api.response.interface';

export class ResponseUtil {
  static success<T>(
    res: Response,
    statusCode: number,
    data?: T,
    message?: string,
  ): Response {
    const response: ApiResponse<T> = {
      statusCode,
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  static error(res: Response, statusCode: number, message: string): Response {
    const response: ApiResponse<null> = {
      statusCode,
      success: false,
      error: message,
    };
    return res.status(statusCode).json(response);
  }
}
