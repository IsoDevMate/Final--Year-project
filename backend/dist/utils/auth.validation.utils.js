"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyQRCodeSchema = exports.passwordResetConfirmSchema = exports.passwordResetSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const user_model_1 = require("../models/user.model");
// Register validation schema
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters'),
    role: zod_1.z.nativeEnum(user_model_1.UserRole).optional()
});
// Login validation schema
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
// Refresh token validation schema
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required')
});
// Password reset request validation schema
exports.passwordResetSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address')
});
// Password reset confirmation validation schema
exports.passwordResetConfirmSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters')
});
exports.verifyQRCodeSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    code: zod_1.z.string().min(1, 'Code is required')
});
