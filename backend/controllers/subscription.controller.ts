import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { SubscriptionService } from '../services/subscription.service';
import {
  createSubscriptionSchema,
  subscriptionQuerySchema
} from '../utils/payment.validation.utils';
import { ResponseUtil } from '../utils/response.utils';
import { UserRole } from '../models/user.model';

export class SubscriptionController {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }


  async getSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = subscriptionQuerySchema.parse(req.query);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userRole = (req.user as any).role;
      const userId = (req.user as any).userId;

      // If not admin, filter by user's own subscriptions
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.ORGANIZER) {
        validatedQuery.userId = userId;
      }

      const subscriptions = await this.subscriptionService.getSubscriptions(validatedQuery);

      return ResponseUtil.success(res, 200, subscriptions, 'Subscriptions retrieved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async checkSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;

      const subscriptionStatus = await this.subscriptionService.checkUserSubscriptionStatus(userId);

      return ResponseUtil.success(res, 200, subscriptionStatus, 'Subscription status checked successfully');
    } catch (error) {
      next(error);
    }
  }

  async cancelSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;

      const subscription = await this.subscriptionService.cancelSubscription(id, userId);

      return ResponseUtil.success(res, 200, subscription, 'Subscription canceled successfully');
    } catch (error) {
      next(error);
    }
  }
}
