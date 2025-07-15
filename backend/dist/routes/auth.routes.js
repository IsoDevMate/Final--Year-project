"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const linkedin_controller_1 = require("../controllers/linkedin.controller");
const auth_mddleware_1 = require("../middleware/auth.mddleware");
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
