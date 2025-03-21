import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response.utils';
import { subscriptionService } from '../services/subscription.service';

export class SubscriptionMiddleware {
  static async checkCanLivestream(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;

      // Check if user has an active subscription that allows livestreaming
      const { hasActiveSubscription, subscription } = await subscriptionService.checkUserSubscriptionStatus(userId);

      if (!hasActiveSubscription || !subscription?.features.canLivestream) {
        return ResponseUtil.error(res, 403, 'Active subscription required for livestreaming');
      }

      // Attach subscription info to request for potential use in controllers
      (req as any).subscription = subscription;

      next();
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionMiddleware = new SubscriptionMiddleware();
