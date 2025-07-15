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
exports.PaymentController = void 0;
const zod_1 = require("zod");
const payment_service_1 = require("../services/payment.service");
const payment_validation_utils_1 = require("../utils/payment.validation.utils");
const response_utils_1 = require("../utils/response.utils");
class PaymentController {
    constructor() {
        this.paymentService = new payment_service_1.PaymentService();
    }
    createCheckoutSession(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = payment_validation_utils_1.createCheckoutSessionSchema.parse(req.body);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                // Get user ID from request (set by auth middleware)
                const userId = req.user.userId;
                const checkoutResult = yield this.paymentService.createCheckoutSession(userId, validatedData);
                return response_utils_1.ResponseUtil.success(res, 201, checkoutResult, 'Checkout session created successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    handleWebhook(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const signature = req.headers['stripe-signature'];
                if (!signature) {
                    return response_utils_1.ResponseUtil.error(res, 400, 'Stripe signature is missing');
                }
                yield this.paymentService.handleStripeWebhook(req.body, signature);
                // Return a 200 response to acknowledge receipt of the webhook
                return res.status(200).send();
            }
            catch (error) {
                console.error('Webhook error:', error);
                // Return a 400 error if the webhook processing fails
                return res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
}
exports.PaymentController = PaymentController;
