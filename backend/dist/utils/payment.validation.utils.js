"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSessionSchema = exports.subscriptionQuerySchema = exports.createSubscriptionSchema = exports.paymentQuerySchema = exports.paymentIdSchema = exports.confirmPaymentSchema = void 0;
const zod_1 = require("zod");
const payment_model_1 = require("../models/payment.model");
const subscription_model_1 = require("../models/subscription.model");
exports.confirmPaymentSchema = zod_1.z.object({
    paymentId: zod_1.z.string(),
    paymentIntentId: zod_1.z.string()
});
exports.paymentIdSchema = zod_1.z.object({
    id: zod_1.z.string()
});
exports.paymentQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => (val ? parseInt(val) : 1)),
    limit: zod_1.z.string().optional().transform(val => (val ? parseInt(val) : 10)),
    userId: zod_1.z.string().optional(),
    eventId: zod_1.z.string().optional(),
    status: zod_1.z.enum([
        payment_model_1.PaymentStatus.PENDING,
        payment_model_1.PaymentStatus.COMPLETED,
        payment_model_1.PaymentStatus.FAILED,
        payment_model_1.PaymentStatus.REFUNDED
    ]).optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    paymentType: zod_1.z.enum(['event', 'subscription']).optional()
});
// Subscription-specific schemas
exports.createSubscriptionSchema = zod_1.z.object({
    planType: zod_1.z.enum([
        subscription_model_1.SubscriptionPlan.BASIC,
        subscription_model_1.SubscriptionPlan.PREMIUM,
        subscription_model_1.SubscriptionPlan.ENTERPRISE
    ]),
    paymentId: zod_1.z.string(),
    eventId: zod_1.z.string().optional()
});
exports.subscriptionQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => (val ? parseInt(val) : 1)),
    limit: zod_1.z.string().optional().transform(val => (val ? parseInt(val) : 10)),
    userId: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    planType: zod_1.z.string().optional()
});
exports.createCheckoutSessionSchema = zod_1.z.object({
    subscriptionPlan: zod_1.z.enum([
        subscription_model_1.SubscriptionPlan.BASIC,
        subscription_model_1.SubscriptionPlan.PREMIUM,
        subscription_model_1.SubscriptionPlan.ENTERPRISE
    ]),
    currency: zod_1.z.string().default('usd'),
    eventId: zod_1.z.string().optional()
});
