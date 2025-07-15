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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const zod_1 = require("zod");
const subscription_service_1 = require("../services/subscription.service");
const payment_validation_utils_1 = require("../utils/payment.validation.utils");
const response_utils_1 = require("../utils/response.utils");
const user_model_1 = require("../models/user.model");
class SubscriptionController {
    constructor() {
        this.subscriptionService = new subscription_service_1.SubscriptionService();
    }
    getSubscriptions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedQuery = payment_validation_utils_1.subscriptionQuerySchema.parse(req.query);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userRole = req.user.role;
                const userId = req.user.userId;
                // If not admin, filter by user's own subscriptions
                if (userRole !== user_model_1.UserRole.ADMIN && userRole !== user_model_1.UserRole.ORGANIZER) {
                    validatedQuery.userId = userId;
                }
                const subscriptions = yield this.subscriptionService.getSubscriptions(validatedQuery);
                return response_utils_1.ResponseUtil.success(res, 200, subscriptions, 'Subscriptions retrieved successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    checkSubscription(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const subscriptionStatus = yield this.subscriptionService.checkUserSubscriptionStatus(userId);
                return response_utils_1.ResponseUtil.success(res, 200, subscriptionStatus, 'Subscription status checked successfully');
            }
            catch (error) {
                next(error);
            }
        });
    }
    cancelSubscription(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const subscription = yield this.subscriptionService.cancelSubscription(id, userId);
                return response_utils_1.ResponseUtil.success(res, 200, subscription, 'Subscription canceled successfully');
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.SubscriptionController = SubscriptionController;
