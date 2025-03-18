import express from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();
const paymentController = new PaymentController();

// Routes that require authentication
router.use(authMiddleware);

// Create payment intent
router.post('/intent', paymentController.createPaymentIntent.bind(paymentController));

// Confirm payment
router.post('/confirm', paymentController.confirmPayment.bind(paymentController));

// Get payment by ID
router.get('/:id', paymentController.getPaymentById.bind(paymentController));

// Get all payments (filtered by user if not admin)
router.get('/', paymentController.getPayments.bind(paymentController));

// Webhook route - no auth required
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook.bind(paymentController));

export default router;
