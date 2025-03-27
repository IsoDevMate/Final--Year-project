import { Types } from 'mongoose';
import Stripe from 'stripe';
import { Payment, PaymentStatus } from '../models/payment.model';
import { User } from '../models/user.model';
import { AppError } from '../utils/errors.utils';
import { CreateCheckoutDto } from '../utils/payment.validation.utils';
import { SubscriptionPlan } from '../models/subscription.model';
import { subscriptionService } from './subscription.service';
import config from '../config/config';
export class PaymentService {
  stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey as string, {
      apiVersion: '2023-10-16'
    });
  }

  async createCheckoutSession(userId: string, checkoutData: CreateCheckoutDto): Promise<any> {
    try {
      // Validate user exists
      if (!Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid user ID', 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get or create Stripe customer
      let stripeCustomerId = await this.getOrCreateStripeCustomer(user);
      if (!stripeCustomerId) {
        throw new AppError('Failed to create Stripe customer', 500);
      }
      console.log('Stripe customer ID:', stripeCustomerId);
      // Set up checkout session parameters for subscription
      const params: Stripe.Checkout.SessionCreateParams = {
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        success_url: `${config.frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.frontendUrl}/subscription/cancel`,
        metadata: {
          userId: userId,
          subscriptionPlan: checkoutData.subscriptionPlan
        },
        // customer_email: user.email,
        line_items: [{
          price: this.getStripePriceId(checkoutData.subscriptionPlan!),
          quantity: 1,
        }]
      };

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create(params);

      if (!session.url) {
        throw new AppError('Failed to create checkout session', 500);
      }
      console.log('Checkout session created:', session.id);

      // Store record in database
      const payment = new Payment({
        userId: user._id,
        amount: 0, // Handled by Stripe subscription
        currency: checkoutData.currency || 'usd',
        status: PaymentStatus.PENDING,
        stripePaymentId: null,
        stripeSessionId: session.id,
        stripeCustomerId,
        description: `${checkoutData.subscriptionPlan} Subscription`,
        metadata: {
          paymentType: 'subscription',
          subscriptionPlan: checkoutData.subscriptionPlan
        }
      });

      await payment.save();

      return {
        url: session.url as string,
        sessionId: session.id
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to create checkout session', 500);
    }
  }

  // Helper to get Stripe price ID for subscription plans
  getStripePriceId(planType: SubscriptionPlan): string {
    const priceIds = {
      [SubscriptionPlan.BASIC]: config.stripe.priceIds.basic,
      [SubscriptionPlan.PREMIUM]: config.stripe.priceIds.premium,
      [SubscriptionPlan.ENTERPRISE]: config.stripe.priceIds.enterprise,
    };

    const priceId = priceIds[planType];
    if (!priceId) {
      throw new AppError(`Invalid subscription plan: ${planType}`, 400);
    }
    return priceId;
  }

  // Helper to get or create Stripe customer
  async getOrCreateStripeCustomer(user: any): Promise<string> {
    // Check if user already has a Stripe customer ID
    const existingPayment = await Payment.findOne({
      userId: user._id,
      stripeCustomerId: { $exists: true }
    });

    if (existingPayment && existingPayment.stripeCustomerId) {
      return existingPayment.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await this.stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: {
        userId: user._id.toString()
      }
    });
    console.log('Stripe customer created:', customer.id);

    return customer.id;
  }

  async handleStripeWebhook(payload: any, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret as string
      );

      // Focus only on subscription-related events
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to process webhook', 500);
    }
  }


  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  try {
    const payment = await Payment.findOne({ stripeSessionId: session.id });
    if (!payment) return;

    payment.status = PaymentStatus.COMPLETED;

    if (session.subscription) {
      payment.stripePaymentId = session.subscription as string;
    }

    await payment.save();

    // Directly create subscription here
    if (session.metadata?.subscriptionPlan && session.customer) {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        session.subscription as string
      );

      await subscriptionService.createSubscriptionFromStripe(
        payment.userId.toString(),
        stripeSubscription,
        payment._id as Types.ObjectId
      );
    }
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
  }
}

  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      // Update local subscription status
      const userId = subscription.metadata.userId;
      const paymentId = new Types.ObjectId(subscription.metadata.paymentId);
      await subscriptionService.createSubscriptionFromStripe(userId, subscription, paymentId);
    } catch (error) {
      console.error('Error handling subscription update:', error);
    }
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      // Mark local subscription as canceled
      const userId = subscription.metadata.userId;
      const paymentId = new Types.ObjectId(subscription.metadata.paymentId);
      await subscriptionService.createSubscriptionFromStripe(userId, subscription, paymentId);
    } catch (error) {
      console.error('Error handling subscription deletion:', error);
    }
  }
}

export const paymentService = new PaymentService();
