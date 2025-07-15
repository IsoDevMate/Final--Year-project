"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subscription_controller_1 = require("../controllers/subscription.controller");
const auth_mddleware_1 = require("../middleware/auth.mddleware");
const payment_controller_1 = require("../controllers/payment.controller");
const paymentController = new payment_controller_1.PaymentController();
const router = express_1.default.Router();
const subscriptionController = new subscription_controller_1.SubscriptionController();
// All routes require authentication
router.use(auth_mddleware_1.AuthMiddleware.verifyToken);
// Get subscriptions (filtered by user if not admin)
router.get('/', subscriptionController.getSubscriptions.bind(subscriptionController));
// Check current user's subscription status
router.get('/status', subscriptionController.checkSubscription.bind(subscriptionController));
// Cancel subscription
router.post('/:id/cancel', subscriptionController.cancelSubscription.bind(subscriptionController));
// Create checkout session for subscription
router.post('/checkout', paymentController.createCheckoutSession.bind(paymentController));
// Webhook route - no auth required
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), paymentController.handleWebhook.bind(paymentController));
exports.default = router;
