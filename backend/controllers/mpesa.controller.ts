
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MPaymentService } from '../services/mpesa.services';
import { eventIdSchema } from '../utils/event.validation';
import { ResponseUtil } from '../utils/response.utils';
import { AppError } from '../utils/errors.utils';
import { initiatePaymentSchema, paymentCallbackSchema } from '../utils/mpesa.validation';
import { Types } from 'mongoose';

export class MPaymentController {
  private mpaymentService: MPaymentService;

  constructor() {
    this.mpaymentService = new MPaymentService();
  }

  async initiatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = eventIdSchema.parse(req.params);
      const validatedData = initiatePaymentSchema.parse(req.body);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;

      const paymentResult = await this.mpaymentService.initiatePayment({
        eventId: id,
        userId,
        phoneNumber: validatedData.phoneNumber,
        amount: validatedData.amount
      });

      return ResponseUtil.success(res, 200, paymentResult, 'Payment initiated successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      if (error instanceof AppError) {
        return ResponseUtil.error(res, error.statusCode, error.message);
      }
      next(error);
    }
  }

  async handlePaymentCallback(req: Request, res: Response, next: NextFunction) {
    try {
    const { eventId, userId } = req.params;

    if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(userId)) {
      console.error(`Invalid ObjectId: eventId=${eventId}, userId=${userId}`);
      res.status(400).json({
        success: false,
        message: 'Invalid request parameters'
      });
      return;
    }
      const callbackData = paymentCallbackSchema.parse(req.body);

      const result = await this.mpaymentService.handlePaymentCallback(callbackData, eventId, userId);

      return ResponseUtil.success(res, 200, result, 'Payment callback processed successfully');
    } catch (error) {
      console.error('Error in M-Pesa callback:', error);
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      if (error instanceof AppError) {
        return ResponseUtil.error(res, error.statusCode, error.message);
      }
      next(error);
    }
  }

  async getPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = eventIdSchema.parse(req.params);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;

      const payment = await this.mpaymentService.getPaymentByEventAndUser(id, userId);

      if (!payment) {
        return ResponseUtil.error(res, 404, 'No payment found for this event');
      }

      return ResponseUtil.success(res, 200, payment, 'Payment status retrieved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      if (error instanceof AppError) {
        return ResponseUtil.error(res, error.statusCode, error.message);
      }
      next(error);
    }
  }
}
