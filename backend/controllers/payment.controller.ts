import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PaymentService } from '../services/payment.service';
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
  paymentQuerySchema,
  paymentIdSchema
} from '../utils/payment.validation.utils';
import { ResponseUtil } from '../utils/response.utils';
import { AppError } from '../utils/errors.utils';
import { UserRole } from '../models/user.model';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async createPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createPaymentIntentSchema.parse(req.body);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      // Get user ID from request (set by auth middleware)
      const userId = (req.user as any).userId;

      const paymentIntent = await this.paymentService.createPaymentIntent(userId, validatedData);

      return ResponseUtil.success(res, 201, paymentIntent, 'Payment intent created successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async confirmPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = confirmPaymentSchema.parse(req.body);

      const payment = await this.paymentService.confirmPayment(
        validatedData.paymentId,
        validatedData.paymentIntentId
      );

      return ResponseUtil.success(res, 200, payment, 'Payment confirmed successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = paymentQuerySchema.parse(req.query);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userRole = (req.user as any).role;
      const userId = (req.user as any).userId;

      // If not admin, filter by user's own payments
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.ORGANIZER) {
        validatedQuery.userId = userId;
      }

      const payments = await this.paymentService.getPayments(validatedQuery);

      return ResponseUtil.success(res, 200, payments, 'Payments retrieved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async getPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = paymentIdSchema.parse(req.params);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userRole = (req.user as any).role;
      const userId = (req.user as any).userId;

      const payment = await this.paymentService.getPaymentById(id);

      if (!payment) {
        return ResponseUtil.error(res, 404, 'Payment not found');
      }

      // Check if user has permission to view this payment
      if (userRole !== UserRole.ADMIN && payment.userId.toString() !== userId) {
        return ResponseUtil.error(res, 403, 'You do not have permission to view this payment');
      }

      return ResponseUtil.success(res, 200, payment, 'Payment retrieved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        return ResponseUtil.error(res, 400, 'Stripe signature is missing');
      }

      await this.paymentService.handleStripeWebhook(req.body, signature);

      // Return a 200 response to acknowledge receipt of the webhook
      return res.status(200).send();
    } catch (error) {
      console.error('Webhook error:', error);
      // Return a 400 error if the webhook processing fails
      return res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
