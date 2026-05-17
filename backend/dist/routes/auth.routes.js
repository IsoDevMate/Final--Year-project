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
const auth_controller_1 = require("../controllers/auth.controller");
const linkedin_controller_1 = require("../controllers/linkedin.controller");
const auth_mddleware_1 = require("../middleware/auth.mddleware");
const user_model_1 = require("../models/user.model");
const event_model_1 = require("../models/event.model");
const note_model_1 = require("../models/note.model");
const mpesapayment_model_1 = require("../models/mpesapayment.model");
const token_model_1 = require("../models/token.model");
const response_utils_1 = require("../utils/response.utils");
const router = (0, express_1.Router)();
// Email & Password Authentication
router.post('/register', auth_controller_1.AuthController.register);
router.post('/login', auth_controller_1.AuthController.login);
router.post('/refresh-token', auth_controller_1.AuthController.refreshToken);
router.post('/logout', auth_controller_1.AuthController.logout);
router.post('/forgot-password', auth_controller_1.AuthController.requestPasswordReset);
router.post('/reset-password', auth_controller_1.AuthController.resetPassword);
router.put('/update-profile', auth_mddleware_1.AuthMiddleware.verifyToken, auth_controller_1.AuthController.updateProfile);
router.get('/profile', auth_mddleware_1.AuthMiddleware.verifyToken, auth_controller_1.AuthController.getUserProfile);
// Deactivate own account (sets isVerified=false as a soft disable flag)
router.post('/deactivate', auth_mddleware_1.AuthMiddleware.verifyToken, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        yield user_model_1.User.findByIdAndUpdate(userId, { isVerified: false });
        // Revoke all tokens
        yield token_model_1.Token.deleteMany({ userId });
        return response_utils_1.ResponseUtil.success(res, 200, null, 'Account deactivated successfully');
    }
    catch (e) {
        next(e);
    }
}));
// Reactivate own account
router.post('/reactivate', auth_mddleware_1.AuthMiddleware.verifyToken, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        yield user_model_1.User.findByIdAndUpdate(userId, { isVerified: true });
        return response_utils_1.ResponseUtil.success(res, 200, null, 'Account reactivated successfully');
    }
    catch (e) {
        next(e);
    }
}));
// Delete own account with cascade
router.delete('/account', auth_mddleware_1.AuthMiddleware.verifyToken, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        if (userRole === user_model_1.UserRole.ORGANIZER) {
            // Delete all events created by organizer (and their attendee references)
            yield event_model_1.Event.deleteMany({ organizer: userId });
        }
        else {
            // Remove user from attendees list of all events they registered for
            yield event_model_1.Event.updateMany({ attendees: userId }, { $pull: { attendees: userId } });
        }
        // Delete all notes by this user
        yield note_model_1.Note.deleteMany({ user: userId });
        // Delete all M-Pesa payments by this user
        yield mpesapayment_model_1.MpesaPayment.deleteMany({ userId });
        // Delete all tokens
        yield token_model_1.Token.deleteMany({ userId });
        // Delete the user
        yield user_model_1.User.findByIdAndDelete(userId);
        return response_utils_1.ResponseUtil.success(res, 200, null, 'Account deleted successfully');
    }
    catch (e) {
        next(e);
    }
}));
// LinkedIn OAuth
router.get('/linkedin', linkedin_controller_1.LinkedInController.getAuthUrl);
router.get('/linkedin/callback', linkedin_controller_1.LinkedInController.handleCallback);
router.get('/me', auth_mddleware_1.AuthMiddleware.verifyToken, (req, res) => {
    return res.status(200).json({
        success: true,
        data: req.user,
        message: 'User authenticated successfully'
    });
});
exports.default = router;
