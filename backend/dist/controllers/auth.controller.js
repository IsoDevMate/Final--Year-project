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
exports.AuthController = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const auth_validation_utils_1 = require("../utils/auth.validation.utils");
const response_utils_1 = require("../utils/response.utils");
const errors_utils_1 = require("../utils/errors.utils");
class AuthController {
    static refreshToken(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = auth_validation_utils_1.refreshTokenSchema.parse(req.body);
                const tokens = yield auth_service_1.authService.refreshToken(validatedData.refreshToken);
                return response_utils_1.ResponseUtil.success(res, 200, tokens, 'Token refreshed successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    static logout(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    return response_utils_1.ResponseUtil.error(res, 400, 'Refresh token is required');
                }
                yield auth_service_1.authService.logout(refreshToken);
                return response_utils_1.ResponseUtil.success(res, 200, null, 'Logout successful');
            }
            catch (error) {
                next(error);
            }
        });
    }
    static resetPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = auth_validation_utils_1.passwordResetConfirmSchema.parse(req.body);
                yield auth_service_1.authService.resetPassword({ token: validatedData.token, newPassword: validatedData.password });
                return response_utils_1.ResponseUtil.success(res, 200, null, 'Password reset successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    static requestPasswordReset(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = auth_validation_utils_1.passwordResetSchema.parse(req.body);
                yield auth_service_1.authService.forgotPassword({ email: validatedData.email });
                // Always return success even if email doesn't exist (for security)
                return response_utils_1.ResponseUtil.success(res, 200, null, 'If the email exists, a password reset link will be sent');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    static register(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = auth_validation_utils_1.registerSchema.parse(req.body);
                const user = yield auth_service_1.authService.register(validatedData);
                return response_utils_1.ResponseUtil.success(res, 201, user, 'User registered successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                if (error instanceof errors_utils_1.AppError) {
                    return response_utils_1.ResponseUtil.error(res, error.statusCode, error.message);
                }
                // Log the unexpected error for server-side tracking
                console.error('Unexpected registration error:', error);
                return response_utils_1.ResponseUtil.error(res, 500, 'An unexpected error occurred during registration');
            }
        });
    }
    static login(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = auth_validation_utils_1.loginSchema.parse(req.body);
                const { user, tokens } = yield auth_service_1.authService.login(validatedData);
                return response_utils_1.ResponseUtil.success(res, 200, { user, tokens }, 'Login successful');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                if (error instanceof errors_utils_1.AppError) {
                    return response_utils_1.ResponseUtil.error(res, error.statusCode, error.message);
                }
                // Log the unexpected error for server-side tracking
                console.error('Unexpected login error:', error);
                return response_utils_1.ResponseUtil.error(res, 500, 'An unexpected error occurred during login');
            }
        });
    }
    static updateProfile(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                console.log('User ID from request:', userId);
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Unauthorized: User not found');
                }
                const updateData = req.body;
                // Validate update data if needed
                const updatedUser = yield auth_service_1.authService.updateProfile(userId, updateData);
                return response_utils_1.ResponseUtil.success(res, 200, updatedUser, 'Profile updated successfully');
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    return response_utils_1.ResponseUtil.error(res, error.statusCode, error.message);
                }
                // Log the unexpected error for server-side tracking
                console.error('Unexpected profile update error:', error);
                return response_utils_1.ResponseUtil.error(res, 500, 'An unexpected error occurred while updating profile');
            }
        });
    }
    static getUserProfile(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                console.log('User ID from request:', userId);
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Unauthorized: User not found');
                }
                const userProfile = yield auth_service_1.authService.getUserProfile(userId);
                return response_utils_1.ResponseUtil.success(res, 200, userProfile, 'User profile retrieved successfully');
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    return response_utils_1.ResponseUtil.error(res, error.statusCode, error.message);
                }
                // Log the unexpected error for server-side tracking
                console.error('Unexpected get profile error:', error);
                return response_utils_1.ResponseUtil.error(res, 500, 'An unexpected error occurred while retrieving profile');
            }
        });
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
