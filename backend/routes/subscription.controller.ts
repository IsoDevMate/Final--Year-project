import express from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();
const subscriptionController = new SubscriptionController();

// All routes require authentication
router.use(authMiddleware);

// Create subscription
router.post('/', subscriptionController.createSubscription.bind(subscriptionController));

// Get subscriptions (filtered by user if not admin)
router.get('/', subscriptionController.getSubscriptions.bind(subscriptionController));

// Check current user's subscription status
router.get('/status', subscriptionController.checkSubscription.bind(subscriptionController));

// Cancel subscription
router.post('/:id/cancel', subscriptionController.cancelSubscription.bind(subscriptionController));

export default router;
