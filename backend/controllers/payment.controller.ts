import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PaymentService } from '../services/payment.service';
import {
  createCheckoutSessionSchema
} from '../utils/payment.validation.utils';
import { ResponseUtil } from '../utils/response.utils';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async createCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createCheckoutSessionSchema.parse(req.body);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      // Get user ID from request (set by auth middleware)
      const userId = (req.user as any).userId;

      const checkoutResult = await this.paymentService.createCheckoutSession(userId, validatedData);

      return ResponseUtil.success(res, 201, checkoutResult, 'Checkout session created successfully');

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
