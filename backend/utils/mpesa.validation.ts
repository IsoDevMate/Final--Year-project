import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  phoneNumber: z.string()
    .regex(/^(?:\+254|0)[17]\d{8}$/, 'Invalid Kenyan phone number format. Use +254XXXXXXXXX or 07XXXXXXXX'),
  amount: z.number().positive('Amount must be positive')
});

export const paymentCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z.object({
        Item: z.array(
          z.object({
            Name: z.string(),
            Value: z.union([z.string(), z.number()]).optional()
          })
        )
      }).optional()
    })
  })
});
