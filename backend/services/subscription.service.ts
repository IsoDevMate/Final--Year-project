import { Types } from 'mongoose';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../models/subscription.model';
import { User } from '../models/user.model';
import { Payment, PaymentStatus } from '../models/payment.model';
import { AppError } from '../utils/errors.utils';
import {  SubscriptionQueryDto } from '../utils/payment.validation.utils';
import Stripe from 'stripe';

// Subscription plan configurations
const SUBSCRIPTION_CONFIGS = {
  [SubscriptionPlan.BASIC]: {
    price: 9.99,
    features: {
      canLivestream: true,
      maxDuration: 60, // minutes
      maxViewers: 100,
      analyticsAccess: false
    },
    durationMonths: 1
  },
  [SubscriptionPlan.PREMIUM]: {
    price: 19.99,
    features: {
      canLivestream: true,
      maxDuration: 120, // minutes
      maxViewers: 500,
      analyticsAccess: true
    },
    durationMonths: 1
  },
  [SubscriptionPlan.ENTERPRISE]: {
    price: 49.99,
    features: {
      canLivestream: true,
      maxDuration: 240,
      maxViewers: 2000,
      analyticsAccess: true
    },
    durationMonths: 1
  }
};

export class SubscriptionService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2023-10-16',
    });
  }


  async checkUserSubscriptionStatus(userId: string): Promise<{
    hasActiveSubscription: boolean;
    subscription?: Subscription | null;
  }> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid user ID', 400);
      }

      const subscription = await Subscription.findOne({
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gt: new Date() }
      });

      return {
        hasActiveSubscription: !!subscription,
        subscription: subscription
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to check subscription status', 500);
    }
  }


  async getSubscriptions(queryParams: SubscriptionQueryDto): Promise<{
    subscriptions: Subscription[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        userId,
        status,
        planType
      } = queryParams;

      const skip = (page - 1) * limit;

      // Build query filters
      const filter: any = {};

      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new AppError('Invalid user ID', 400);
        }
        filter.userId = userId;
      }

      if (status) {
        filter.status = status;
      }

      if (planType) {
        filter.planType = planType;
      }

      // Execute query with pagination
      const subscriptions = await Subscription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email')
        .populate('paymentId');

      // Get total count for pagination
      const total = await Subscription.countDocuments(filter);

      return {
        subscriptions,
        total,
        page: Number(page),
        limit: Number(limit)
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve subscriptions', 500);
    }
  }


async createSubscriptionFromStripe(
  userId: string,
  stripeSubscription: Stripe.Subscription,
  paymentId: Types.ObjectId
): Promise<Subscription> {
  try {
    // Extract metadata
    const metadata = stripeSubscription.metadata || {};
    const planType = metadata.subscriptionPlan as SubscriptionPlan;

    if (!planType) {
      throw new AppError('Subscription plan type not found in metadata', 400);
    }

    // Get plan config
    const planConfig = SUBSCRIPTION_CONFIGS[planType];

    // Calculate subscription dates based on Stripe data
    const startDate = new Date(stripeSubscription.current_period_start * 1000);
    const endDate = new Date(stripeSubscription.current_period_end * 1000);

    // Get price info from Stripe
    const priceItem = stripeSubscription.items.data[0];
    const price = priceItem.price;

    // Create subscription record
    const subscription = new Subscription({
      userId,
      planType,
      status: this.mapStripeStatusToLocal(stripeSubscription.status),
      startDate,
      endDate,
      stripeSubscriptionId: stripeSubscription.id,
      price: price.unit_amount ? price.unit_amount / 100 : planConfig.price,
      currency: price.currency,
      paymentId,
      features: planConfig.features
    });

    await subscription.save();
    return subscription;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create subscription from Stripe data', 500);
  }
}

// Map Stripe subscription status to your local status
private mapStripeStatusToLocal(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return SubscriptionStatus.ACTIVE;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'incomplete':
    case 'incomplete_expired':
    case 'past_due':
    case 'unpaid':
      return SubscriptionStatus.INACTIVE;
    default:
      return SubscriptionStatus.INACTIVE;
  }
}

// Cancel subscription through Stripe
async cancelSubscription(subscriptionId: string, userId: string): Promise<Subscription> {
  try {
    if (!Types.ObjectId.isValid(subscriptionId)) {
      throw new AppError('Invalid subscription ID', 400);
    }

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    // Verify the user owns the subscription
    if (subscription.userId.toString() !== userId) {
      throw new AppError('You do not have permission to cancel this subscription', 403);
    }

    // Only cancel in Stripe if there's a Stripe subscription ID
    if (subscription.stripeSubscriptionId) {
      // Cancel the subscription in Stripe
      await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      // Webhook will update our database
    } else {
      // If no Stripe ID (rare case), update locally
      subscription.status = SubscriptionStatus.CANCELED;
      await subscription.save();
    }

    return subscription;
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(error.message, 400);
    }
    throw new AppError('Failed to cancel subscription', 500);
  }
  }

}

export const subscriptionService = new SubscriptionService();
