
import { Router } from 'express';
import { MPaymentController } from '../controllers/mpesa.controller';
import { AuthMiddleware } from '../middleware/auth.mddleware';

const router = Router();
const paymentController = new MPaymentController();

router.post('/check/:id', AuthMiddleware.verifyToken, paymentController.checkPaymentStatus.bind(paymentController));

// Initiate payment for event registration
router.post(
  '/event/:id',
  AuthMiddleware.verifyToken,
  paymentController.initiatePayment.bind(paymentController)
);

// Get payment status
router.get(
  '/event/:id',
  AuthMiddleware.verifyToken,
  paymentController.getPaymentStatus.bind(paymentController)
);

// M-Pesa callback endpoint (public)
router.post(
  '/callback/:eventId/:userId',
  paymentController.handlePaymentCallback.bind(paymentController)
);

export default router;
