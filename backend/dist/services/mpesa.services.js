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
exports.MPaymentService = void 0;
const mongoose_1 = require("mongoose");
const mpesapayment_model_1 = require("../models/mpesapayment.model");
const mpesaApi_service_1 = require("./mpesaApi.service");
const errors_utils_1 = require("../utils/errors.utils");
const event_service_1 = require("./event.service");
class MPaymentService {
    constructor() {
        this.mpesaService = new mpesaApi_service_1.MpesaService();
        this.eventService = new event_service_1.EventService();
    }
    initiatePayment(paymentData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Initiating payment with data:', paymentData);
                // Validate payment data
                if (!paymentData.eventId || !paymentData.userId || !paymentData.phoneNumber || !paymentData.amount) {
                    throw new errors_utils_1.AppError('Missing required payment data', 400);
                }
                // Check if event exists and has space
                const event = yield this.eventService.getEventById(paymentData.eventId);
                if (!event) {
                    throw new errors_utils_1.AppError('Event not found', 404);
                }
                // Check if event has reached capacity
                if (event.capacity && event.attendees.length >= event.capacity) {
                    throw new errors_utils_1.AppError('Event has reached maximum capacity', 400);
                }
                const isUserRegistered = event.attendees.some((attendee) => {
                    console.log('Checking attendee:', attendee);
                    // Handle if attendee is already an ObjectId
                    if (attendee instanceof mongoose_1.Types.ObjectId) {
                        const isMatch = attendee.toString() === paymentData.userId;
                        console.log(`Attendee is ObjectId. Match: ${isMatch}`);
                        return isMatch;
                    }
                    // Handle if attendee is a user object with _id
                    if (typeof attendee === 'object' && '_id' in attendee && attendee._id instanceof mongoose_1.Types.ObjectId) {
                        const isMatch = attendee._id.toString() === paymentData.userId;
                        console.log(`Attendee is user object with _id. Match: ${isMatch}`);
                        return isMatch;
                    }
                    // Handle if it's a string representation of a user object (your case)
                    if (typeof attendee === 'string') {
                        const isMatch = attendee.includes(paymentData.userId);
                        console.log(`Attendee is string. Match: ${isMatch}`);
                        return isMatch;
                    }
                    console.log('Attendee type not recognized.');
                    return false;
                });
                console.log('Is user registered:', isUserRegistered);
                if (isUserRegistered) {
                    throw new errors_utils_1.AppError('User already registered for this event', 400);
                }
                // Validate event capacity constraints
                if (event.capacity) {
                    if (event.capacity > 5000) {
                        throw new errors_utils_1.AppError('Maximum event capacity is 5000', 400);
                    }
                    if (event.capacity < 30) {
                        throw new errors_utils_1.AppError('Minimum event capacity is 30', 400);
                    }
                }
                // Get the ticket price from the event
                const ticketPrice = event.ticketPrice || 0;
                // Verify the amount matches the ticket price
                if (ticketPrice !== paymentData.amount) {
                    throw new errors_utils_1.AppError(`Payment amount doesn't match event ticket price. Expected: ${ticketPrice}`, 400);
                }
                // Generate a unique callbackUrl with event and user IDs
                const callbackUrl = `${process.env.APP_URL || 'https://final-year-project-jy2j.onrender.com'}/api/v1/mpesa/callback/${paymentData.eventId}/${paymentData.userId}`;
                // Initiate STK push
                const stkPushResponse = yield this.mpesaService.initiateSTKPush({
                    phoneNumber: paymentData.phoneNumber,
                    amount: paymentData.amount,
                    callbackUrl,
                    accountReference: `Event#${paymentData.eventId}`,
                    description: `Payment for ${event.title}`
                });
                // Create payment record in pending state
                const payment = new mpesapayment_model_1.MpesaPayment({
                    amount: paymentData.amount,
                    paymentMethod: mpesapayment_model_1.MpesaPaymentMethod.MPESA,
                    status: mpesapayment_model_1.MpesaPaymentStatus.PENDING,
                    eventId: new mongoose_1.Types.ObjectId(paymentData.eventId),
                    userId: new mongoose_1.Types.ObjectId(paymentData.userId),
                    phoneNumber: paymentData.phoneNumber,
                    merchantRequestId: stkPushResponse.MerchantRequestID,
                    checkoutRequestId: stkPushResponse.CheckoutRequestID
                });
                yield payment.save();
                return {
                    paymentId: payment._id,
                    merchantRequestId: payment.merchantRequestId,
                    checkoutRequestId: payment.checkoutRequestId,
                    status: payment.status
                };
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to initiate payment', 500);
            }
        });
    }
    handlePaymentCallback(callbackData, eventId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Parse callback data
                const paymentResult = this.mpesaService.parseCallbackData(callbackData);
                // Log the values for debugging
                console.log(`Callback for eventId: ${eventId}, userId: ${userId}`);
                if (!mongoose_1.Types.ObjectId.isValid(eventId) || !mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new errors_utils_1.AppError('Invalid eventId or userId format', 400);
                }
                // Find the payment record
                const payment = yield mpesapayment_model_1.MpesaPayment.findOne({
                    merchantRequestId: callbackData.Body.stkCallback.MerchantRequestID,
                    checkoutRequestId: callbackData.Body.stkCallback.CheckoutRequestID,
                    eventId: new mongoose_1.Types.ObjectId(eventId),
                    userId: new mongoose_1.Types.ObjectId(userId)
                });
                if (!payment) {
                    throw new errors_utils_1.AppError('Payment record not found', 404);
                }
                // Update payment status
                payment.status = paymentResult.success ? mpesapayment_model_1.MpesaPaymentStatus.COMPLETED : mpesapayment_model_1.MpesaPaymentStatus.FAILED;
                payment.resultCode = paymentResult.resultCode;
                payment.resultDesc = paymentResult.resultDesc;
                if (paymentResult.success) {
                    payment.transactionId = paymentResult.transactionId;
                }
                yield payment.save();
                // If payment was successful, register the user for the event
                if (paymentResult.success) {
                    yield this.eventService.registerAttendee(eventId, userId);
                }
                console.log('Payment record updated:', payment);
                console.log('Payment result:', paymentResult);
                return {
                    success: paymentResult.success,
                    paymentId: payment._id,
                    status: payment.status,
                    message: paymentResult.resultDesc
                };
            }
            catch (error) {
                console.error('Error handling payment callback:', error);
                console.error('EventId:', eventId, 'UserId:', userId);
                console.error('MerchantRequestID:', callbackData.Body.stkCallback.MerchantRequestID);
                console.error('CheckoutRequestID:', callbackData.Body.stkCallback.CheckoutRequestID);
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to process payment callback', 500);
            }
        });
    }
    checkPaymentStatus(eventId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Find the payment record
                const payment = yield mpesapayment_model_1.MpesaPayment.findOne({
                    eventId: new mongoose_1.Types.ObjectId(eventId),
                    userId: new mongoose_1.Types.ObjectId(userId),
                    status: mpesapayment_model_1.MpesaPaymentStatus.PENDING
                });
                if (!payment) {
                    throw new errors_utils_1.AppError('No pending payment found for this event', 404);
                }
                // Query M-Pesa for status
                if (!payment.checkoutRequestId) {
                    throw new errors_utils_1.AppError('CheckoutRequestID is missing', 400);
                }
                const stkStatusResponse = yield this.mpesaService.querySTKStatus(payment.checkoutRequestId);
                // Parse response
                const resultCode = stkStatusResponse.ResultCode;
                const resultDesc = stkStatusResponse.ResultDesc;
                const requestId = stkStatusResponse.CheckoutRequestID;
                console.log(`STK query result: Code=${resultCode}, Desc=${resultDesc}, RequestID=${requestId}`);
                // Update payment based on status code
                if (resultCode === 0) {
                    // Success status (paid)
                    payment.status = mpesapayment_model_1.MpesaPaymentStatus.COMPLETED;
                    payment.resultCode = resultCode;
                    payment.resultDesc = resultDesc;
                    yield payment.save();
                    // Register the user for the event
                    yield this.eventService.registerAttendee(eventId, userId);
                    return {
                        success: true,
                        paymentId: payment._id,
                        status: payment.status,
                        message: 'Payment completed successfully'
                    };
                }
                else if (resultCode === 1032) {
                    // Transaction canceled by user or still waiting
                    return {
                        success: false,
                        paymentId: payment._id,
                        status: payment.status,
                        message: 'Payment is still pending or was canceled'
                    };
                }
                else {
                    // Failed transaction
                    payment.status = mpesapayment_model_1.MpesaPaymentStatus.FAILED;
                    payment.resultCode = resultCode;
                    payment.resultDesc = resultDesc;
                    yield payment.save();
                    return {
                        success: false,
                        paymentId: payment._id,
                        status: payment.status,
                        message: resultDesc || 'Payment failed'
                    };
                }
            }
            catch (error) {
                console.error('Error checking payment status:', error);
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to check payment status', 500);
            }
        });
    }
    getPaymentByEventAndUser(eventId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield mpesapayment_model_1.MpesaPayment.findOne({
                    eventId: new mongoose_1.Types.ObjectId(eventId),
                    userId: new mongoose_1.Types.ObjectId(userId)
                });
            }
            catch (error) {
                throw new errors_utils_1.AppError('Failed to retrieve payment information', 500);
            }
        });
    }
}
exports.MPaymentService = MPaymentService;
