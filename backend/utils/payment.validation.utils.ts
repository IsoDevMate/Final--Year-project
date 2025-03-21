// import { z } from 'zod';

// export const createPaymentIntentSchema = z.object({
//   eventId: z.string().nonempty('Event ID is required'),
//   amount: z.number().positive('Amount must be positive'),
//   currency: z.string().default('usd'),
//   paymentMethod: z.string().optional(),
//   description: z.string().optional(),
//   metadata: z.record(z.any()).optional()
// });

// export const confirmPaymentSchema = z.object({
//   paymentId: z.string().nonempty('Payment ID is required'),
//   paymentIntentId: z.string().nonempty('Payment Intent ID is required')
// });

// export const paymentQuerySchema = z.object({
//   page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
//   limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
//   userId: z.string().optional(),
//   eventId: z.string().optional(),
//   status: z.string().optional(),
//   startDate: z.string().optional(),
//   endDate: z.string().optional()
// });

// export const paymentIdSchema = z.object({
//   id: z.string().nonempty('Payment ID is required')
// });

// export type CreatePaymentIntentDto = z.infer<typeof createPaymentIntentSchema>;
// export type ConfirmPaymentDto = z.infer<typeof confirmPaymentSchema>;
// export type PaymentQueryDto = z.infer<typeof paymentQuerySchema>;


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

// Types based on Zod schemas
export type CreatePaymentIntentDto = z.infer<typeof createPaymentIntentSchema>;
export type ConfirmPaymentDto = z.infer<typeof confirmPaymentSchema>;
export type PaymentQueryDto = z.infer<typeof paymentQuerySchema>;
export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
export type SubscriptionQueryDto = z.infer<typeof subscriptionQuerySchema>;
