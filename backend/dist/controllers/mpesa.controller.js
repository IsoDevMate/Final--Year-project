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
exports.MPaymentController = void 0;
const zod_1 = require("zod");
const mpesa_services_1 = require("../services/mpesa.services");
const event_validation_1 = require("../utils/event.validation");
const response_utils_1 = require("../utils/response.utils");
const errors_utils_1 = require("../utils/errors.utils");
const mpesa_validation_1 = require("../utils/mpesa.validation");
const mongoose_1 = require("mongoose");
class MPaymentController {
    constructor() {
        this.mpaymentService = new mpesa_services_1.MPaymentService();
    }
    initiatePayment(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = event_validation_1.eventIdSchema.parse(req.params);
                const validatedData = mpesa_validation_1.initiatePaymentSchema.parse(req.body);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const paymentResult = yield this.mpaymentService.initiatePayment({
                    eventId: id,
                    userId,
                    phoneNumber: validatedData.phoneNumber,
                    amount: validatedData.amount
                });
                return response_utils_1.ResponseUtil.success(res, 200, paymentResult, 'Payment initiated successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                if (error instanceof errors_utils_1.AppError) {
                    return response_utils_1.ResponseUtil.error(res, error.statusCode, error.message);
                }
                next(error);
            }
        });
    }
    handlePaymentCallback(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { eventId, userId } = req.params;
                if (!mongoose_1.Types.ObjectId.isValid(eventId) || !mongoose_1.Types.ObjectId.isValid(userId)) {
                    console.error(`Invalid ObjectId: eventId=${eventId}, userId=${userId}`);
                    res.status(400).json({
                        success: false,
                        message: 'Invalid request parameters'
                    });
                    return;
                }
                const callbackData = mpesa_validation_1.paymentCallbackSchema.parse(req.body);
                const result = yield this.mpaymentService.handlePaymentCallback(callbackData, eventId, userId);
                return response_utils_1.ResponseUtil.success(res, 200, result, 'Payment callback processed successfully');
            }
            catch (error) {
                console.error('Error in M-Pesa callback:', error);
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                if (error instanceof errors_utils_1.AppError) {
                    return response_utils_1.ResponseUtil.error(res, error.statusCode, error.message);
                }
                next(error);
            }
        });
    }
    getPaymentStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = event_validation_1.eventIdSchema.parse(req.params);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                console.log('User ID:', userId);
                const payment = yield this.mpaymentService.getPaymentByEventAndUser(id, userId);
                if (!payment) {
                    return response_utils_1.ResponseUtil.error(res, 404, 'No payment found for this event');
                }
                return response_utils_1.ResponseUtil.success(res, 200, payment, 'Payment status retrieved successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                if (error instanceof errors_utils_1.AppError) {
                    return response_utils_1.ResponseUtil.error(res, error.statusCode, error.message);
                }
                next(error);
            }
        });
    }
    checkPaymentStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = event_validation_1.eventIdSchema.parse(req.params);
                // Check authentication
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const result = yield this.mpaymentService.checkPaymentStatus(id, userId);
                return response_utils_1.ResponseUtil.success(res, 200, result, 'Payment status checked successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                if (error instanceof errors_utils_1.AppError) {
                    return response_utils_1.ResponseUtil.error(res, error.statusCode, error.message);
                }
                next(error);
            }
        });
    }
}
exports.MPaymentController = MPaymentController;
