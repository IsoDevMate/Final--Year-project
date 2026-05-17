"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mpesa_controller_1 = require("../controllers/mpesa.controller");
const auth_mddleware_1 = require("../middleware/auth.mddleware");
const router = (0, express_1.Router)();
const paymentController = new mpesa_controller_1.MPaymentController();
router.post('/check/:id', auth_mddleware_1.AuthMiddleware.verifyToken, paymentController.checkPaymentStatus.bind(paymentController));
// Initiate payment for event registration
router.post('/event/:id', auth_mddleware_1.AuthMiddleware.verifyToken, paymentController.initiatePayment.bind(paymentController));
// Get payment status
router.get('/event/:id', auth_mddleware_1.AuthMiddleware.verifyToken, paymentController.getPaymentStatus.bind(paymentController));
// M-Pesa callback endpoint (public)
router.post('/callback/:eventId/:userId', paymentController.handlePaymentCallback.bind(paymentController));
exports.default = router;
