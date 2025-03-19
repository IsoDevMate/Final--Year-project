import { Router } from 'express';
import authRoutes from './auth.routes';
// import eventRoutes from './event.routes';
// import paymentRoutes from './payment.routes';

const router = Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Authentication routes
router.use(`${API_PREFIX}/auth`, authRoutes);

// router.use(`${API_PREFIX}/events`, eventRoutes);
// router.use(`${API_PREFIX}/payments`, paymentRoutes);

export default router;

