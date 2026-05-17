"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mpesa_controller_1 = require("../controllers/mpesa.controller");
const auth_mddleware_1 = require("../middleware/auth.mddleware");
const mpesapayment_model_1 = require("../models/mpesapayment.model");
const response_utils_1 = require("../utils/response.utils");
const router = (0, express_1.Router)();
const paymentController = new mpesa_controller_1.MPaymentController();
router.post('/check/:id', auth_mddleware_1.AuthMiddleware.verifyToken, paymentController.checkPaymentStatus.bind(paymentController));
// Get current user's own payment history
router.get('/my-payments', auth_mddleware_1.AuthMiddleware.verifyToken, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const payments = yield mpesapayment_model_1.MpesaPayment.find({ userId })
            .populate('eventId', 'title')
            .sort({ createdAt: -1 })
            .lean();
        return response_utils_1.ResponseUtil.success(res, 200, payments, 'Payments retrieved');
    }
    catch (e) {
        next(e);
    }
}));
// Initiate payment for event registration
router.post('/event/:id', auth_mddleware_1.AuthMiddleware.verifyToken, paymentController.initiatePayment.bind(paymentController));
// Get payment status
router.get('/event/:id', auth_mddleware_1.AuthMiddleware.verifyToken, paymentController.getPaymentStatus.bind(paymentController));
// M-Pesa callback endpoint (public)
router.post('/callback/:eventId/:userId', paymentController.handlePaymentCallback.bind(paymentController));
exports.default = router;
