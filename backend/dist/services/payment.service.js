"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const mongoose_1 = require("mongoose");
const stripe_1 = __importDefault(require("stripe"));
const payment_model_1 = require("../models/payment.model");
const user_model_1 = require("../models/user.model");
const errors_utils_1 = require("../utils/errors.utils");
const subscription_model_1 = require("../models/subscription.model");
const subscription_service_1 = require("./subscription.service");
const config_1 = __importDefault(require("../config/config"));
class PaymentService {
    constructor() {
        this.stripe = new stripe_1.default(config_1.default.stripe.secretKey, {
            apiVersion: '2023-10-16'
        });
    }
    createCheckoutSession(userId, checkoutData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate user exists
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new errors_utils_1.AppError('Invalid user ID', 400);
                }
                const user = yield user_model_1.User.findById(userId);
                if (!user) {
                    throw new errors_utils_1.AppError('User not found', 404);
                }
                // Get or create Stripe customer
                let stripeCustomerId = yield this.getOrCreateStripeCustomer(user);
                if (!stripeCustomerId) {
                    throw new errors_utils_1.AppError('Failed to create Stripe customer', 500);
                }
                console.log('Stripe customer ID:', stripeCustomerId);
                // Set up checkout session parameters for subscription
                const params = {
                    customer: stripeCustomerId,
                    payment_method_types: ['card'],
                    mode: 'subscription',
                    success_url: `${config_1.default.frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${config_1.default.frontendUrl}/subscription/cancel`,
                    metadata: {
                        userId: userId,
                        subscriptionPlan: checkoutData.subscriptionPlan
                    },
                    // customer_email: user.email,
                    line_items: [{
                            price: this.getStripePriceId(checkoutData.subscriptionPlan),
                            quantity: 1,
                        }]
                };
                // Create checkout session
                const session = yield this.stripe.checkout.sessions.create(params);
                if (!session.url) {
                    throw new errors_utils_1.AppError('Failed to create checkout session', 500);
                }
                console.log('Checkout session created:', session.id);
                // Store record in database
                const payment = new payment_model_1.Payment({
                    userId: user._id,
                    amount: 0, // Handled by Stripe subscription
                    currency: checkoutData.currency || 'usd',
                    status: payment_model_1.PaymentStatus.PENDING,
                    stripePaymentId: null,
                    stripeSessionId: session.id,
                    stripeCustomerId,
                    description: `${checkoutData.subscriptionPlan} Subscription`,
                    metadata: {
                        paymentType: 'subscription',
                        subscriptionPlan: checkoutData.subscriptionPlan
                    }
                });
                yield payment.save();
                return {
                    url: session.url,
                    sessionId: session.id
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to create checkout session', 500);
            }
        });
    }
    // Helper to get Stripe price ID for subscription plans
    getStripePriceId(planType) {
        const priceIds = {
            [subscription_model_1.SubscriptionPlan.BASIC]: config_1.default.stripe.priceIds.basic,
            [subscription_model_1.SubscriptionPlan.PREMIUM]: config_1.default.stripe.priceIds.premium,
            [subscription_model_1.SubscriptionPlan.ENTERPRISE]: config_1.default.stripe.priceIds.enterprise,
        };
        const priceId = priceIds[planType];
        if (!priceId) {
            throw new errors_utils_1.AppError(`Invalid subscription plan: ${planType}`, 400);
        }
        return priceId;
    }
    // Helper to get or create Stripe customer
    getOrCreateStripeCustomer(user) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if user already has a Stripe customer ID
            const existingPayment = yield payment_model_1.Payment.findOne({
                userId: user._id,
                stripeCustomerId: { $exists: true }
            });
            if (existingPayment && existingPayment.stripeCustomerId) {
                return existingPayment.stripeCustomerId;
            }
            // Create new Stripe customer
            const customer = yield this.stripe.customers.create({
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                metadata: {
                    userId: user._id.toString()
                }
            });
            console.log('Stripe customer created:', customer.id);
            return customer.id;
        });
    }
    handleStripeWebhook(payload, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const event = this.stripe.webhooks.constructEvent(payload, signature, config_1.default.stripe.webhookSecret);
                // Focus only on subscription-related events
                switch (event.type) {
                    case 'checkout.session.completed':
                        yield this.handleCheckoutSessionCompleted(event.data.object);
                        break;
                    case 'customer.subscription.created':
                    case 'customer.subscription.updated':
                        yield this.handleSubscriptionUpdated(event.data.object);
                        break;
                    case 'customer.subscription.deleted':
                        yield this.handleSubscriptionDeleted(event.data.object);
                        break;
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to process webhook', 500);
            }
        });
    }
    handleCheckoutSessionCompleted(session) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const payment = yield payment_model_1.Payment.findOne({ stripeSessionId: session.id });
                if (!payment)
                    return;
                payment.status = payment_model_1.PaymentStatus.COMPLETED;
                if (session.subscription) {
                    payment.stripePaymentId = session.subscription;
                }
                yield payment.save();
                // Directly create subscription here
                if (((_a = session.metadata) === null || _a === void 0 ? void 0 : _a.subscriptionPlan) && session.customer) {
                    const stripeSubscription = yield this.stripe.subscriptions.retrieve(session.subscription);
                    yield subscription_service_1.subscriptionService.createSubscriptionFromStripe(payment.userId.toString(), stripeSubscription, payment._id);
                }
            }
            catch (error) {
                console.error('Error handling checkout.session.completed:', error);
            }
        });
    }
    handleSubscriptionUpdated(subscription) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Update local subscription status
                const userId = subscription.metadata.userId;
                const paymentId = new mongoose_1.Types.ObjectId(subscription.metadata.paymentId);
                yield subscription_service_1.subscriptionService.createSubscriptionFromStripe(userId, subscription, paymentId);
            }
            catch (error) {
                console.error('Error handling subscription update:', error);
            }
        });
    }
    handleSubscriptionDeleted(subscription) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Mark local subscription as canceled
                const userId = subscription.metadata.userId;
                const paymentId = new mongoose_1.Types.ObjectId(subscription.metadata.paymentId);
                yield subscription_service_1.subscriptionService.createSubscriptionFromStripe(userId, subscription, paymentId);
            }
            catch (error) {
                console.error('Error handling subscription deletion:', error);
            }
        });
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
