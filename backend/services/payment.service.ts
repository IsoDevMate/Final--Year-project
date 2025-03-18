import { Types } from 'mongoose';
import Stripe from 'stripe';
import { Payment, PaymentStatus } from '../models/payment.model';
import { User } from '../models/user.model';
import { Event } from '../models/event.model';
import { AppError } from '../utils/errors.utils';
import { CreatePaymentIntentDto, PaymentQueryDto } from '../utils/payment.validation.utils';
import config from '../config/config';

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
      // Validate event exists
      if (!Types.ObjectId.isValid(paymentData.eventId)) {
        throw new AppError('Invalid event ID', 400);
      }

      const event = await Event.findById(paymentData.eventId);
      if (!event) {
        throw new AppError('Event not found', 404);
      }

      // Validate user exists
      if (!Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid user ID', 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
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
            userId: user._id.toString()
          }
        });
        stripeCustomerId = customer.id;
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: paymentData.currency || 'usd',
        customer: stripeCustomerId,
        metadata: {
          userId: user._id.toString(),
          eventId: event._id.toString(),
          ...(paymentData.metadata || {})
        },
        description: paymentData.description || `Payment for ${event.title}`
      });

      // Save payment record
      const payment = new Payment({
        userId: user._id,
        eventId: event._id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'usd',
        status: PaymentStatus.PENDING,
        stripePaymentId: paymentIntent.id,
        stripeCustomerId,
        description: paymentData.description || `Payment for ${event.title}`,
        metadata: paymentData.metadata
      });

      await payment.save();

      return {
        clientSecret: paymentIntent.client_secret as string,
        paymentId: payment._id.toString()
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to create payment intent', 500);
    }
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
          payment.receiptUrl = paymentIntent.charges.data[0]?.receipt_url || undefined;
          break;
        case 'canceled':
          payment.status = PaymentStatus.FAILED;
          break;
        default:
          // Leave as pending for other statuses
          break;
      }

      await payment.save();

      // If payment is completed, handle post-payment actions (e.g., register for event)
      if (payment.status === PaymentStatus.COMPLETED) {
        // Attempt to register user for event
        try {
          const eventService = new (require('./event.service').EventService)();
          await eventService.registerAttendee(payment.eventId.toString(), payment.userId.toString());
        } catch (error) {
          // Log error but don't fail the payment confirmation
          console.error('Failed to register user for event after payment:', error);
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

  async handleStripeWebhook(payload: any, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret as string
      );

      // Handle specific event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        // Add more cases as needed
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to process webhook', 500);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const payment = await Payment.findOne({ stripePaymentId: paymentIntent.id });
      if (payment) {
        payment.status = PaymentStatus.COMPLETED;
        payment.receiptUrl = paymentIntent.charges.data[0]?.receipt_url;
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
