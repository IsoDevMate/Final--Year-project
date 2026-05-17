"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyQRCodeSchema = exports.passwordResetConfirmSchema = exports.passwordResetSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const user_model_1 = require("../models/user.model");
const nameField = (label) => zod_1.z.string()
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} cannot exceed 50 characters`)
    .regex(/^[A-Za-z\s'\-]+$/, `${label} must contain letters only`);
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    firstName: nameField('First name'),
    lastName: nameField('Last name'),
    role: zod_1.z.nativeEnum(user_model_1.UserRole).optional()
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters')
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required')
});
exports.passwordResetSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address')
});
exports.passwordResetConfirmSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
});
exports.verifyQRCodeSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    code: zod_1.z.string().min(1, 'Code is required')
});
