import { z } from 'zod';
import { PaymentStatus } from '../models/payment.model';
import { SubscriptionPlan } from '../models/subscription.model';

// Base payment intent schema
export const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  eventId: z.string().optional(),
  paymentType: z.enum(['event', 'subscription']).default('event'),
  // Only required if paymentType is subscription
  subscriptionPlan: z.enum([
    SubscriptionPlan.BASIC,
    SubscriptionPlan.PREMIUM,
    SubscriptionPlan.ENTERPRISE
  ]).optional()
});

export const confirmPaymentSchema = z.object({
  paymentId: z.string(),
  paymentIntentId: z.string()
});

export const paymentIdSchema = z.object({
  id: z.string()
});

export const paymentQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
  userId: z.string().optional(),
  eventId: z.string().optional(),
  status: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.COMPLETED,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED
  ]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentType: z.enum(['event', 'subscription']).optional()
});

// Subscription-specific schemas
export const createSubscriptionSchema = z.object({
  planType: z.enum([
    SubscriptionPlan.BASIC,
    SubscriptionPlan.PREMIUM,
    SubscriptionPlan.ENTERPRISE
  ]),
  paymentId: z.string()
});

export const subscriptionQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
  userId: z.string().optional(),
  status: z.string().optional(),
  planType: z.string().optional()
});

// In payment.validation.utils.ts
export const createCheckoutSessionSchema = z.object({
  mode: z.enum(['payment', 'subscription']),
  amount: z.number().positive().optional(),
  currency: z.string().default('usd'),
  productName: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  eventId: z.string().optional(),
  subscriptionPlan: z.enum([
    SubscriptionPlan.BASIC,
    SubscriptionPlan.PREMIUM,
    SubscriptionPlan.ENTERPRISE
  ]).optional()
}).refine(data => {
  // Ensure amount is provided for one-time payments
  if (data.mode === 'payment' && !data.amount) {
    return false;
  }
  // Ensure subscription plan is provided for subscription mode
  if (data.mode === 'subscription' && !data.subscriptionPlan) {
    return false;
  }
  return true;
}, {
  message: "Amount required for one-time payments; subscription plan required for subscriptions"
});

export type CreateCheckoutDto = z.infer<typeof createCheckoutSessionSchema>;
export type CreatePaymentIntentDto = z.infer<typeof createPaymentIntentSchema>;
export type ConfirmPaymentDto = z.infer<typeof confirmPaymentSchema>;
export type PaymentQueryDto = z.infer<typeof paymentQuerySchema>;
export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
export type SubscriptionQueryDto = z.infer<typeof subscriptionQuerySchema>;
