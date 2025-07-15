"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentCallbackSchema = exports.initiatePaymentSchema = void 0;
const zod_1 = require("zod");
exports.initiatePaymentSchema = zod_1.z.object({
    phoneNumber: zod_1.z.string()
        .regex(/^(?:\+254|0)[17]\d{8}$/, 'Invalid Kenyan phone number format. Use +254XXXXXXXXX or 07XXXXXXXX'),
    amount: zod_1.z.number().positive('Amount must be positive')
});
exports.paymentCallbackSchema = zod_1.z.object({
    Body: zod_1.z.object({
        stkCallback: zod_1.z.object({
            MerchantRequestID: zod_1.z.string(),
            CheckoutRequestID: zod_1.z.string(),
            ResultCode: zod_1.z.number(),
            ResultDesc: zod_1.z.string(),
            CallbackMetadata: zod_1.z.object({
                Item: zod_1.z.array(zod_1.z.object({
                    Name: zod_1.z.string(),
                    Value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional()
                }))
            }).optional()
        })
    })
});
