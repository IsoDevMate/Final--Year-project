
import { Types } from 'mongoose';
import Stripe from 'stripe';
import { Payment, PaymentStatus } from '../models/payment.model';
import { User } from '../models/user.model';
import { Event } from '../models/event.model';
import { AppError } from '../utils/errors.utils';
import { CreatePaymentIntentDto, PaymentQueryDto } from '../utils/payment.validation.utils';
import { SubscriptionPlan } from '../models/subscription.model';
import { subscriptionService } from './subscription.service';
import config from '../config/config';

// Subscription plan prices (should match the subscription service)
const SUBSCRIPTION_PRICES = {
  [SubscriptionPlan.BASIC]: 9.99,
  [SubscriptionPlan.PREMIUM]: 19.99,
  [SubscriptionPlan.ENTERPRISE]: 49.99
};

export class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey as string, {
      apiVersion: '2023-10-16'
    });
  }

  async createPaymentIntent(userId: string, paymentData: CreatePaymentIntentDto): Promise<{
    clientSecret: string;
    paymentId: string;
  }> {
    try {
      // Validate user exists
      if (!Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid user ID', 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Handle different payment types
      let eventId: string | undefined = undefined;
      let amount = paymentData.amount;
      let description = paymentData.description;

      if (paymentData.paymentType === 'event') {
        // Event payment - validate event exists
        if (!paymentData.eventId) {
          throw new AppError('Event ID is required for event payments', 400);
        }

        if (!Types.ObjectId.isValid(paymentData.eventId)) {
          throw new AppError('Invalid event ID', 400);
        }

        const event = await Event.findById(paymentData.eventId);
        if (!event) {
          throw new AppError('Event not found', 404);
        }

        let eventId: string | undefined = undefined;
        description = description || `Payment for ${event.title}`;
      } else if (paymentData.paymentType === 'subscription') {
        // Subscription payment - validate plan
        if (!paymentData.subscriptionPlan) {
          throw new AppError('Subscription plan is required for subscription payments', 400);
        }

        // Use predefined price for the subscription plan
        amount = SUBSCRIPTION_PRICES[paymentData.subscriptionPlan];
        description = description || `Subscription: ${paymentData.subscriptionPlan}`;
      }

      // Create or get Stripe customer
      let stripeCustomerId = '';

      // Check if user already has a Stripe customer ID
      const existingPayment = await Payment.findOne({ userId: user._id, stripeCustomerId: { $exists: true } });

      if (existingPayment && existingPayment.stripeCustomerId) {
        stripeCustomerId = existingPayment.stripeCustomerId;
      } else {
        // Create new Stripe customer
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: (user as any)._id.toString()
          }
        });
        stripeCustomerId = customer.id;
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: paymentData.currency || 'usd',
        customer: stripeCustomerId,
        metadata: {
          userId: (user as any)._id.toString(),
          paymentType: paymentData.paymentType,
          ...(eventId ? { eventId: eventId.toString() } : {}),
          ...(paymentData.subscriptionPlan ? { subscriptionPlan: paymentData.subscriptionPlan } : {}),
          ...(paymentData.metadata || {})
        },
        description: description
      });

      // Save payment record
      const payment = new Payment({
        userId: user._id,
        ...(eventId ? { eventId } : {}),
        amount,
        currency: paymentData.currency || 'usd',
        status: PaymentStatus.PENDING,
        stripePaymentId: paymentIntent.id,
        stripeCustomerId,
        description,
        metadata: {
          ...paymentData.metadata,
          paymentType: paymentData.paymentType,
          ...(paymentData.subscriptionPlan ? { subscriptionPlan: paymentData.subscriptionPlan } : {})
        }
      });

      await payment.save();

      return {
        clientSecret: paymentIntent.client_secret as string,
        paymentId: (payment._id as Types.ObjectId).toString()
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to create payment intent', 500);
    }
  }


async createCheckoutSession(userId: string, checkoutData: CreateCheckoutDto): Promise<string> {
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

    // Set up checkout session parameters
    const params: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: checkoutData.mode, // 'payment' for one-time, 'subscription' for recurring
      success_url: `${config.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/payment/cancel`,
      metadata: {
        userId: userId,
      },
      customer_email: user.email,
    };

    // Handle different checkout modes
    if (checkoutData.mode === 'payment') {
      // One-time payment (e.g., event registration)
      params.line_items = [{
        price_data: {
          currency: checkoutData.currency || 'usd',
          product_data: {
            name: checkoutData.productName || 'Event Registration',
            description: checkoutData.description,
          },
          unit_amount: Math.round(checkoutData.amount * 100), // Convert to cents
        },
        quantity: 1,
      }];

      if (checkoutData.eventId) {
        params.metadata.eventId = checkoutData.eventId;
        params.metadata.paymentType = 'event';
      }
    }
    else if (checkoutData.mode === 'subscription') {
      // Subscription payment
      // Use pre-defined price IDs from Stripe Dashboard
      const priceId = this.getStripePriceId(checkoutData.subscriptionPlan);

      params.line_items = [{
        price: priceId,
        quantity: 1,
      }];

      params.metadata.subscriptionPlan = checkoutData.subscriptionPlan;
      params.metadata.paymentType = 'subscription';
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create(params);

    // Store record in database
    const payment = new Payment({
      userId: user._id,
      ...(checkoutData.eventId ? { eventId: checkoutData.eventId } : {}),
      amount: checkoutData.amount,
      currency: checkoutData.currency || 'usd',
      status: PaymentStatus.PENDING,
      stripeSessionId: session.id,
      stripeCustomerId,
      description: checkoutData.description,
      metadata: {
        ...checkoutData.metadata,
        paymentType: checkoutData.mode === 'subscription' ? 'subscription' : 'event',
        ...(checkoutData.subscriptionPlan ? { subscriptionPlan: checkoutData.subscriptionPlan } : {})
      }
    });

    await payment.save();

    return session.url as string;
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(error.message, 400);
    }
    throw new AppError('Failed to create checkout session', 500);
  }
}

// Helper to get Stripe price ID for subscription plans
private getStripePriceId(planType: SubscriptionPlan): string {
  const priceIds = {
    [SubscriptionPlan.BASIC]: config.stripe.priceIds.basic,
    [SubscriptionPlan.PREMIUM]: config.stripe.priceIds.premium,
    [SubscriptionPlan.ENTERPRISE]: config.stripe.priceIds.enterprise,
  };

  return priceIds[planType];
}

// Helper to get or create Stripe customer
private async getOrCreateStripeCustomer(user: any): Promise<string> {
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

  return customer.id;
}

  async confirmPayment(paymentId: string, paymentIntentId: string): Promise<Payment> {
    try {
      // Validate payment exists
      if (!Types.ObjectId.isValid(paymentId)) {
        throw new AppError('Invalid payment ID', 400);
      }

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // Verify payment intent ID matches
      if (payment.stripePaymentId !== paymentIntentId) {
        throw new AppError('Payment intent ID mismatch', 400);
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      // Update payment status based on Stripe status
      switch (paymentIntent.status) {
        case 'succeeded':
          payment.status = PaymentStatus.COMPLETED;
          const charges = await this.stripe.charges.list({ payment_intent: paymentIntent.id });
          payment.receiptUrl = charges.data[0]?.receipt_url || undefined;
          break;
        case 'canceled':
          payment.status = PaymentStatus.FAILED;
          break;
        default:
          // Leave as pending for other statuses
          break;
      }

      await payment.save();

      // If payment is completed, handle post-payment actions
      if (payment.status === PaymentStatus.COMPLETED) {
        const metadata = payment.metadata?.toJSON() || {};

        if (metadata.paymentType === 'event' && payment.eventId) {
          // Handle event registration
          try {
            const eventService = new (require('./event.service').EventService)();
            await eventService.registerAttendee(payment.eventId.toString(), payment.userId.toString());
          } catch (error) {
            // Log error but don't fail the payment confirmation
            console.error('Failed to register user for event after payment:', error);
          }
        } else if (metadata.paymentType === 'subscription' && metadata.subscriptionPlan) {
          // Handle subscription creation
          try {
            await subscriptionService.createSubscription(payment.userId.toString(), {
              planType: metadata.subscriptionPlan as SubscriptionPlan,
              paymentId: (payment._id as Types.ObjectId).toString()
            });
          } catch (error) {
            // Log error but don't fail the payment confirmation
            console.error('Failed to create subscription after payment:', error);
          }
        }
      }

      return payment;
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to confirm payment', 500);
    }
  }

   async getPayments(queryParams: PaymentQueryDto): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        userId,
        eventId,
        status,
        startDate,
        endDate
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

      if (eventId) {
        if (!Types.ObjectId.isValid(eventId)) {
          throw new AppError('Invalid event ID', 400);
        }
        filter.eventId = eventId;
      }

      if (status) {
        filter.status = status;
      }

      // Date range filter
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Execute query with pagination
      const payments = await Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email')
        .populate('eventId', 'title');

      // Get total count for pagination
      const total = await Payment.countDocuments(filter);

      return {
        payments,
        total,
        page: Number(page),
        limit: Number(limit)
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve payments', 500);
    }
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      if (!Types.ObjectId.isValid(paymentId)) {
        throw new AppError('Invalid payment ID', 400);
      }

      return await Payment.findById(paymentId)
        .populate('userId', 'firstName lastName email')
        .populate('eventId', 'title');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve payment', 500);
    }
  }

// Enhanced webhook handler in payment.service.ts
async handleStripeWebhook(payload: any, signature: string): Promise<void> {
  try {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret as string
    );

    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(error.message, 400);
    }
    throw new AppError('Failed to process webhook', 500);
  }
}

// Handle checkout session completion
private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  try {
    // Find the payment record
    const payment = await Payment.findOne({ stripeSessionId: session.id });
    if (!payment) return;

    // Update payment status
    payment.status = PaymentStatus.COMPLETED;

    // Store relevant details
    if (session.payment_intent) {
      payment.stripePaymentId = session.payment_intent as string;
    }

    await payment.save();

    // Process based on payment type
    const metadata = payment.metadata?.toJSON() || {};

    if (metadata.paymentType === 'event' && payment.eventId) {
      // Handle event registration
      try {
        const eventService = new (require('./event.service').EventService)();
        await eventService.registerAttendee(payment.eventId.toString(), payment.userId.toString());
      } catch (error) {
        console.error('Failed to register user for event after payment:', error);
      }
    }
    else if (metadata.paymentType === 'subscription' && session.subscription) {
      // For subscriptions, just record the ID - the subscription webhook will handle details
      const subscriptionId = session.subscription as string;

      // Create a subscription record if it doesn't exist
      const existingSubscription = await Subscription.findOne({
        stripeSubscriptionId: subscriptionId
      });

      if (!existingSubscription) {
        // Get subscription details from Stripe
        const stripeSubscription = await this.stripe.subscriptions.retrieve(subscriptionId);

        // Create subscription record
        await subscriptionService.createSubscriptionFromStripe(
          payment.userId.toString(),
          stripeSubscription,
          payment._id
        );
      }
    }
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
  }
}


  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const payment = await Payment.findOne({ stripePaymentId: paymentIntent.id });
      if (payment) {
        payment.status = PaymentStatus.COMPLETED;
        const charges = await this.stripe.charges.list({ payment_intent: paymentIntent.id });
        payment.receiptUrl = charges.data[0]?.receipt_url || undefined;
        await payment.save();
      }
    } catch (error) {
      console.error('Error handling payment_intent.succeeded:', error);
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const payment = await Payment.findOne({ stripePaymentId: paymentIntent.id });
      if (payment) {
        payment.status = PaymentStatus.FAILED;
        await payment.save();
      }
    } catch (error) {
      console.error('Error handling payment_intent.payment_failed:', error);
    }
  }
}

export const paymentService = new PaymentService();
