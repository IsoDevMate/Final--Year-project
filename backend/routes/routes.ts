// import { Router } from 'express';
// import { AuthController } from '../controllers/auth.controller';
// import { AuthGuard } from '../guards/auth.guard';

// const router = Router();
// const authController = new AuthController();

// // Public routes
// router.post('/register', authController.register);

// // Social auth routes (protected - user must be authenticated first)
// router.post('/social/link', AuthGuard.verifyToken, authController.socialLogin);

// export default router;

// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
// We'll add other routes as we implement them
// import eventRoutes from './event.routes';
// import paymentRoutes from './payment.routes';

const router = Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Authentication routes
router.use(`${API_PREFIX}/auth`, authRoutes);

// Other routes to be added as we implement them
// router.use(`${API_PREFIX}/events`, eventRoutes);
// router.use(`${API_PREFIX}/payments`, paymentRoutes);

export default router;

