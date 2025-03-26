import { z } from 'zod';
import { PaymentStatus } from '../models/payment.model';
import { SubscriptionPlan } from '../models/subscription.model';

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
  paymentId: z.string(),
  eventId: z.string().optional()
});

export const subscriptionQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
  userId: z.string().optional(),
  status: z.string().optional(),
  planType: z.string().optional()
});

export const createCheckoutSessionSchema = z.object({
  subscriptionPlan: z.enum([
    SubscriptionPlan.BASIC,
    SubscriptionPlan.PREMIUM,
    SubscriptionPlan.ENTERPRISE
  ]),
  currency: z.string().default('usd'),
   eventId: z.string().optional()
});

export type CreateCheckoutDto = z.infer<typeof createCheckoutSessionSchema>;
export type ConfirmPaymentDto = z.infer<typeof confirmPaymentSchema>;
export type PaymentQueryDto = z.infer<typeof paymentQuerySchema>;
export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
export type SubscriptionQueryDto = z.infer<typeof subscriptionQuerySchema>;
