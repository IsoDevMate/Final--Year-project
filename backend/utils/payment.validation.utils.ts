import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  eventId: z.string().nonempty('Event ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('usd'),
  paymentMethod: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const confirmPaymentSchema = z.object({
  paymentId: z.string().nonempty('Payment ID is required'),
  paymentIntentId: z.string().nonempty('Payment Intent ID is required')
});

export const paymentQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
  userId: z.string().optional(),
  eventId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export const paymentIdSchema = z.object({
  id: z.string().nonempty('Payment ID is required')
});

export type CreatePaymentIntentDto = z.infer<typeof createPaymentIntentSchema>;
export type ConfirmPaymentDto = z.infer<typeof confirmPaymentSchema>;
export type PaymentQueryDto = z.infer<typeof paymentQuerySchema>;
