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
exports.subscriptionMiddleware = exports.SubscriptionMiddleware = void 0;
const response_utils_1 = require("../utils/response.utils");
const subscription_service_1 = require("../services/subscription.service");
class SubscriptionMiddleware {
    static checkCanLivestream(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                // Check if user has an active subscription that allows livestreaming
                const { hasActiveSubscription, subscription } = yield subscription_service_1.subscriptionService.checkUserSubscriptionStatus(userId);
                if (!hasActiveSubscription || !(subscription === null || subscription === void 0 ? void 0 : subscription.features.canLivestream)) {
                    return response_utils_1.ResponseUtil.error(res, 403, 'Active subscription required for livestreaming');
                }
                // Attach subscription info to request for potential use in controllers
                req.subscription = subscription;
                next();
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.SubscriptionMiddleware = SubscriptionMiddleware;
exports.subscriptionMiddleware = new SubscriptionMiddleware();
