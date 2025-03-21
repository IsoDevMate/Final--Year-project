import { Types } from 'mongoose';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../models/subscription.model';
import { User } from '../models/user.model';
import { Payment, PaymentStatus } from '../models/payment.model';
import { AppError } from '../utils/errors.utils';
import { CreateSubscriptionDto, SubscriptionQueryDto } from '../utils/payment.validation.utils';

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
      maxDuration: 240, // minutes
      maxViewers: 2000,
      analyticsAccess: true
    },
    durationMonths: 1
  }
};

export class SubscriptionService {
  async createSubscription(userId: string, subscriptionData: CreateSubscriptionDto): Promise<Subscription> {
    try {
      // Validate user exists
      if (!Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid user ID', 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Validate payment exists and is completed
      if (!Types.ObjectId.isValid(subscriptionData.paymentId)) {
        throw new AppError('Invalid payment ID', 400);
      }

      const payment = await Payment.findById(subscriptionData.paymentId);
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new AppError('Payment is not completed', 400);
      }

      // Get subscription plan config
      const planConfig = SUBSCRIPTION_CONFIGS[subscriptionData.planType];
      if (!planConfig) {
        throw new AppError('Invalid subscription plan', 400);
      }

      // Check for existing active subscription
      const existingSubscription = await Subscription.findOne({
        userId: user._id,
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gt: new Date() }
      });

      if (existingSubscription) {
        throw new AppError('User already has an active subscription', 400);
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + planConfig.durationMonths);

      // Create new subscription
      const subscription = new Subscription({
        userId: user._id,
        planType: subscriptionData.planType,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        price: planConfig.price,
        currency: payment.currency,
        paymentId: payment._id,
        features: planConfig.features
      });

      await subscription.save();
      return subscription;
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to create subscription', 500);
    }
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

      // Update subscription status
      subscription.status = SubscriptionStatus.CANCELED;
      await subscription.save();

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
