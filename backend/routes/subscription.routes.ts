import express from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { AuthMiddleware } from '../middleware/auth.mddleware';
import { PaymentController } from '../controllers/payment.controller';


const paymentController = new PaymentController();
import { UserRole } from '../models/user.model';

const router = express.Router();
const subscriptionController = new SubscriptionController();

// All routes require authentication
router.use(AuthMiddleware.verifyToken);



// Get subscriptions (filtered by user if not admin)
router.get('/', subscriptionController.getSubscriptions.bind(subscriptionController));

// Check current user's subscription status
router.get('/status', subscriptionController.checkSubscription.bind(subscriptionController));

// Cancel subscription
router.post('/:id/cancel', subscriptionController.cancelSubscription.bind(subscriptionController));

// Create checkout session for subscription
router.post('/checkout', paymentController.createCheckoutSession.bind(paymentController));

// Webhook route - no auth required
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook.bind(paymentController));

export default router;
