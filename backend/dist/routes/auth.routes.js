"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// Change password (requires current password)
router.post('/change-password', auth_mddleware_1.AuthMiddleware.verifyToken, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword)
            return response_utils_1.ResponseUtil.error(res, 400, 'Current and new password are required');
        if (newPassword.length < 8)
            return response_utils_1.ResponseUtil.error(res, 400, 'New password must be at least 8 characters');
        const userId = req.user.userId;
        const user = yield user_model_1.User.findById(userId);
        if (!user)
            return response_utils_1.ResponseUtil.error(res, 404, 'User not found');
        const bcrypt = yield Promise.resolve().then(() => __importStar(require('bcrypt')));
        const valid = yield bcrypt.compare(currentPassword, user.password);
        if (!valid)
            return response_utils_1.ResponseUtil.error(res, 400, 'Current password is incorrect');
        user.password = yield bcrypt.hash(newPassword, 10);
        yield user.save();
        // Revoke all other tokens so other sessions are invalidated
        yield token_model_1.Token.deleteMany({ userId });
        return response_utils_1.ResponseUtil.success(res, 200, null, 'Password changed successfully');
    }
    catch (e) {
        next(e);
    }
}));
// List active sessions (tokens) for current user
router.get('/sessions', auth_mddleware_1.AuthMiddleware.verifyToken, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = req.user.userId;
        const currentToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        const sessions = yield token_model_1.Token.find({ userId }).lean();
        const data = sessions.map(s => ({
            _id: s._id,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            isCurrent: s.token === currentToken,
            userAgent: (req.headers['user-agent'] || 'Unknown') // simplified — all tokens show same UA
        }));
        return response_utils_1.ResponseUtil.success(res, 200, data, 'Sessions retrieved');
    }
    catch (e) {
        next(e);
    }
}));
// Revoke a specific session
router.delete('/sessions/:tokenId', auth_mddleware_1.AuthMiddleware.verifyToken, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        yield token_model_1.Token.deleteOne({ _id: req.params.tokenId, userId });
        return response_utils_1.ResponseUtil.success(res, 200, null, 'Session revoked');
    }
    catch (e) {
        next(e);
    }
}));
// Revoke all sessions except current
router.delete('/sessions', auth_mddleware_1.AuthMiddleware.verifyToken, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = req.user.userId;
        const currentToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        yield token_model_1.Token.deleteMany({ userId, token: { $ne: currentToken } });
        return response_utils_1.ResponseUtil.success(res, 200, null, 'All other sessions revoked');
    }
    catch (e) {
        next(e);
    }
}));
router.post('/deactivate', auth_mddleware_1.AuthMiddleware.verifyToken, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        yield user_model_1.User.findByIdAndUpdate(userId, { isActive: false });
        // Revoke all tokens so they must re-login (which will be blocked)
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
        yield user_model_1.User.findByIdAndUpdate(userId, { isActive: true });
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
