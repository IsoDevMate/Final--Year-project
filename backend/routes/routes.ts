import { Router } from 'express';
import authRoutes from './auth.routes';
import eventRoutes from './event.routes';
import notesroutes from './notes.routes';
import sessionroutes from './session.routes';
import paymentRoutes from './subscription.routes';
import linkedInSharingRoutes from './linkedinsharing.routes';
import mpesaroutes from './mpesa.routes';
import reportsRoutes from './report.routes';
import adminRoutes from './admin.routes';
const router = Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Test endpoint to verify logging
router.get('/test-logging', (req, res) => {
  console.log('🧪 Test logging endpoint hit!');
  res.json({ message: 'Logging test successful', timestamp: new Date().toISOString() });
});

// Authentication routes
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/events`, eventRoutes);
router.use(`${API_PREFIX}/payments`, paymentRoutes);
router.use(`${API_PREFIX}/notes`, notesroutes);
router.use(`${API_PREFIX}/sessions`, sessionroutes);
router.use(`${API_PREFIX}/linkedin`, linkedInSharingRoutes);
router.use(`${API_PREFIX}/mpesa`, mpesaroutes);
router.use(`${API_PREFIX}/reports`, reportsRoutes);
router.use(`${API_PREFIX}/admin`, adminRoutes);

export default router;
