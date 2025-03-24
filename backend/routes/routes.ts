import { Router } from 'express';
import authRoutes from './auth.routes';
import eventRoutes from './event.routes';
import notesroutes from './notes.routes';
import sessionroutes from './session.routes';
// import paymentRoutes from './payment.routes';
import linkedInSharingRoutes from './linkedinsharing.routes';

const router = Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Authentication routes
router.use(`${API_PREFIX}/auth`, authRoutes);

router.use(`${API_PREFIX}/events`, eventRoutes);
// router.use(`${API_PREFIX}/payments`, paymentRoutes);
router.use(`${API_PREFIX}/notes`, notesroutes);
router.use(`${API_PREFIX}/sessions`, sessionroutes);
router.use(`${API_PREFIX}/linkedin`, linkedInSharingRoutes);

export default router;
