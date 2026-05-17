
import { Router } from 'express';
import { MPaymentController } from '../controllers/mpesa.controller';
import { AuthMiddleware } from '../middleware/auth.mddleware';
import { MpesaPayment } from '../models/mpesapayment.model';
import { ResponseUtil } from '../utils/response.utils';

const router = Router();
const paymentController = new MPaymentController();

router.post('/check/:id', AuthMiddleware.verifyToken, paymentController.checkPaymentStatus.bind(paymentController));

// Get current user's own payment history
router.get('/my-payments', AuthMiddleware.verifyToken, async (req, res, next) => {
  try {
    const userId = (req.user as any).userId;
    const payments = await MpesaPayment.find({ userId })
      .populate('eventId', 'title')
      .sort({ createdAt: -1 })
      .lean();
    return ResponseUtil.success(res, 200, payments, 'Payments retrieved');
  } catch (e) { next(e); }
});

// Initiate payment for event registration
router.post('/event/:id', AuthMiddleware.verifyToken, paymentController.initiatePayment.bind(paymentController));

// Get payment status
router.get('/event/:id', AuthMiddleware.verifyToken, paymentController.getPaymentStatus.bind(paymentController));

// M-Pesa callback endpoint (public)
router.post('/callback/:eventId/:userId', paymentController.handlePaymentCallback.bind(paymentController));

export default router;
