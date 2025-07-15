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
exports.subscriptionService = exports.SubscriptionService = void 0;
const mongoose_1 = require("mongoose");
const subscription_model_1 = require("../models/subscription.model");
const errors_utils_1 = require("../utils/errors.utils");
const stripe_1 = __importDefault(require("stripe"));
// Subscription plan configurations
const SUBSCRIPTION_CONFIGS = {
    [subscription_model_1.SubscriptionPlan.BASIC]: {
        price: 9.99,
        features: {
            canLivestream: true,
            maxDuration: 60, // minutes
            maxViewers: 100,
            analyticsAccess: false
        },
        durationMonths: 1
    },
    [subscription_model_1.SubscriptionPlan.PREMIUM]: {
        price: 19.99,
        features: {
            canLivestream: true,
            maxDuration: 120, // minutes
            maxViewers: 500,
            analyticsAccess: true
        },
        durationMonths: 1
    },
    [subscription_model_1.SubscriptionPlan.ENTERPRISE]: {
        price: 49.99,
        features: {
            canLivestream: true,
            maxDuration: 240,
            maxViewers: 2000,
            analyticsAccess: true
        },
        durationMonths: 1
    }
};
class SubscriptionService {
    constructor() {
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16',
        });
    }
    checkUserSubscriptionStatus(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new errors_utils_1.AppError('Invalid user ID', 400);
                }
                const subscription = yield subscription_model_1.Subscription.findOne({
                    userId,
                    status: subscription_model_1.SubscriptionStatus.ACTIVE,
                    endDate: { $gt: new Date() }
                });
                return {
                    hasActiveSubscription: !!subscription,
                    subscription: subscription
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to check subscription status', 500);
            }
        });
    }
    getSubscriptions(queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = 1, limit = 10, userId, status, planType } = queryParams;
                const skip = (page - 1) * limit;
                // Build query filters
                const filter = {};
                if (userId) {
                    if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                        throw new errors_utils_1.AppError('Invalid user ID', 400);
                    }
                    filter.userId = userId;
                }
                if (status) {
                    filter.status = status;
                }
                if (planType) {
                    filter.planType = planType;
                }
                // Execute query with pagination
                const subscriptions = yield subscription_model_1.Subscription.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('userId', 'firstName lastName email')
                    .populate('paymentId');
                // Get total count for pagination
                const total = yield subscription_model_1.Subscription.countDocuments(filter);
                return {
                    subscriptions,
                    total,
                    page: Number(page),
                    limit: Number(limit)
                };
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to retrieve subscriptions', 500);
            }
        });
    }
    createSubscriptionFromStripe(userId, stripeSubscription, paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Extract metadata
                const metadata = stripeSubscription.metadata || {};
                const planType = metadata.subscriptionPlan;
                if (!planType) {
                    throw new errors_utils_1.AppError('Subscription plan type not found in metadata', 400);
                }
                // Get plan config
                const planConfig = SUBSCRIPTION_CONFIGS[planType];
                // Calculate subscription dates based on Stripe data
                const startDate = new Date(stripeSubscription.current_period_start * 1000);
                const endDate = new Date(stripeSubscription.current_period_end * 1000);
                // Get price info from Stripe
                const priceItem = stripeSubscription.items.data[0];
                const price = priceItem.price;
                // Create subscription record
                const subscription = new subscription_model_1.Subscription({
                    userId,
                    planType,
                    status: this.mapStripeStatusToLocal(stripeSubscription.status),
                    startDate,
                    endDate,
                    stripeSubscriptionId: stripeSubscription.id,
                    price: price.unit_amount ? price.unit_amount / 100 : planConfig.price,
                    currency: price.currency,
                    paymentId,
                    features: planConfig.features
                });
                yield subscription.save();
                return subscription;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to create subscription from Stripe data', 500);
            }
        });
    }
    // Map Stripe subscription status to your local status
    mapStripeStatusToLocal(stripeStatus) {
        switch (stripeStatus) {
            case 'active':
            case 'trialing':
                return subscription_model_1.SubscriptionStatus.ACTIVE;
            case 'canceled':
                return subscription_model_1.SubscriptionStatus.CANCELED;
            case 'incomplete':
            case 'incomplete_expired':
            case 'past_due':
            case 'unpaid':
                return subscription_model_1.SubscriptionStatus.INACTIVE;
            default:
                return subscription_model_1.SubscriptionStatus.INACTIVE;
        }
    }
    // Cancel subscription through Stripe
    cancelSubscription(subscriptionId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(subscriptionId)) {
                    throw new errors_utils_1.AppError('Invalid subscription ID', 400);
                }
                const subscription = yield subscription_model_1.Subscription.findById(subscriptionId);
                if (!subscription) {
                    throw new errors_utils_1.AppError('Subscription not found', 404);
                }
                // Verify the user owns the subscription
                if (subscription.userId.toString() !== userId) {
                    throw new errors_utils_1.AppError('You do not have permission to cancel this subscription', 403);
                }
                // Only cancel in Stripe if there's a Stripe subscription ID
                if (subscription.stripeSubscriptionId) {
                    // Cancel the subscription in Stripe
                    yield this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
                    // Webhook will update our database
                }
                else {
                    // If no Stripe ID (rare case), update locally
                    subscription.status = subscription_model_1.SubscriptionStatus.CANCELED;
                    yield subscription.save();
                }
                return subscription;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to cancel subscription', 500);
            }
        });
    }
}
exports.SubscriptionService = SubscriptionService;
exports.subscriptionService = new SubscriptionService();
