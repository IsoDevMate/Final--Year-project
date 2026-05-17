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
exports.LinkedInSharingController = void 0;
const linkedinsharing_service_1 = require("../services/linkedinsharing.service");
const response_utils_1 = require("../utils/response.utils");
const errors_utils_1 = require("../utils/errors.utils");
const linkedin_auth_service_1 = require("../services/linkedin.auth.service");
const user_model_1 = require("../models/user.model");
class LinkedInSharingController {
    /**
     * Check if a user has a linked LinkedIn account
     */
    static checkLinkedInStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                // Get userId from authenticated user
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'User not authenticated');
                }
                // Find user with detailed social links
                const user = yield user_model_1.User.findById(userId).select('socialLinks');
                if (!user) {
                    return response_utils_1.ResponseUtil.error(res, 404, 'User not found');
                }
                // Check if LinkedIn ID exists
                const hasLinkedInId = !!((_b = user.socialLinks) === null || _b === void 0 ? void 0 : _b.linkedinId);
                // Check token validity - use a separate function to avoid 'this' context issues
                const isTokenValid = LinkedInSharingController.validateLinkedInToken(user);
                return response_utils_1.ResponseUtil.success(res, 200, {
                    hasLinkedIn: hasLinkedInId,
                    linkedInId: (_c = user.socialLinks) === null || _c === void 0 ? void 0 : _c.linkedinId,
                    isTokenValid
                }, 'LinkedIn account status retrieved');
            }
            catch (error) {
                console.error('LinkedIn status check error:', error);
                next(new errors_utils_1.AppError('Failed to check LinkedIn status', 500));
            }
        });
    }
    /**
     * Validate LinkedIn token
     */
    /**
     * Attempt to refresh LinkedIn token if invalid
     */
    static refreshTokenIfNeeded(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // If token is invalid, attempt to refresh
                if (!this.validateLinkedInToken(user)) {
                    yield linkedin_auth_service_1.LinkedInService.refreshLinkedInToken(user);
                    return true;
                }
                return false;
            }
            catch (error) {
                console.error('Token refresh error:', error);
                return false;
            }
        });
    }
    static shareNote(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { noteId } = req.params;
                const { customMessage } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'User not authenticated');
                }
                const result = yield linkedinsharing_service_1.LinkedInSharingService.shareNote(noteId, userId, customMessage);
                return response_utils_1.ResponseUtil.success(res, 200, result, 'Note successfully shared to LinkedIn');
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Share content to LinkedIn based on content type
    */
    static shareContent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { note, user } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'User not authenticated');
                }
                const result = yield linkedinsharing_service_1.LinkedInSharingService.shareContent(note, user);
                return response_utils_1.ResponseUtil.success(res, 200, result, 'Content successfully shared to LinkedIn');
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Specific method to share text post
     */
    static shareTextPost(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { note, user } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'User not authenticated');
                }
                const result = yield linkedinsharing_service_1.LinkedInSharingService.shareTextPost(note, user);
                return response_utils_1.ResponseUtil.success(res, 200, result, 'Text post successfully shared to LinkedIn');
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Specific method to share image post
    */
    // static async shareImagePost(req: Request, res: Response, next: NextFunction) {
    //   try {
    //     const { note, user } = req.body;
    //     const userId = (req.user as any)?.userId;
    //     if (!userId) {
    //       return ResponseUtil.error(res, 401, 'User not authenticated');
    //     }
    //     const result = await LinkedInSharingService.shareImagePost(note, user);
    //     return ResponseUtil.success(res, 200, result, 'Image post successfully shared to LinkedIn');
    //   } catch (error) {
    //     next(error);
    //   }
    // }
    // static validateLinkedInToken(user: any): boolean {
    //   // Check if tokens exist and are not expired
    //   const hasAccessToken = !!user.socialLinks?.linkedinAccessToken;
    //   const hasTokenExpiry = user.socialLinks?.linkedinTokenExpiry;
    //   if (!hasAccessToken || !hasTokenExpiry) {
    //     return false;
    //   }
    //   // Check if token is still valid (not expired)
    //   return new Date(user.socialLinks.linkedinTokenExpiry) > new Date();
    // }
    /**
   * Fix for shareImagePost method in LinkedInSharingController
   */
    static shareImagePost(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'User not authenticated');
                }
                // First retrieve the full user record to ensure we have complete data
                const user = yield user_model_1.User.findById(userId);
                if (!user) {
                    return response_utils_1.ResponseUtil.error(res, 404, 'User not found');
                }
                // Check if LinkedIn account is connected
                if (!((_b = user.socialLinks) === null || _b === void 0 ? void 0 : _b.linkedinId)) {
                    return response_utils_1.ResponseUtil.error(res, 400, 'LinkedIn account not connected. Please connect your LinkedIn account first.');
                }
                // Check if token exists and is valid
                const isTokenValid = LinkedInSharingController.validateLinkedInToken(user);
                if (!isTokenValid && !((_c = user.socialLinks) === null || _c === void 0 ? void 0 : _c.linkedinRefreshToken)) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'LinkedIn session expired. Please reconnect your LinkedIn account.');
                }
                // Now pass the full user object instead of just req.body.user
                const result = yield linkedinsharing_service_1.LinkedInSharingService.shareImagePost(req.body.note, user);
                return response_utils_1.ResponseUtil.success(res, 200, result, 'Image post successfully shared to LinkedIn');
            }
            catch (error) {
                console.error('Controller error:', error);
                // Handle specific error types
                if (error instanceof errors_utils_1.AppError) {
                    return response_utils_1.ResponseUtil.error(res, error.statusCode || 500, error.message);
                }
                next(error);
            }
        });
    }
    /**
     * Fix for validateLinkedInToken method in LinkedInSharingController
     */
    static validateLinkedInToken(user) {
        if (!user || !user.socialLinks) {
            return false;
        }
        // Check if tokens exist and are not expired
        const hasAccessToken = !!user.socialLinks.linkedinAccessToken;
        const hasTokenExpiry = user.socialLinks.linkedinTokenExpiry;
        if (!hasAccessToken || !hasTokenExpiry) {
            return false;
        }
        // Check if token is still valid (not expired)
        const expiryDate = new Date(user.socialLinks.linkedinTokenExpiry);
        const now = new Date();
        // Add some logging for debugging
        console.log('Token expiry check:', {
            expiryDate,
            now,
            isValid: expiryDate > now
        });
        return expiryDate > now;
    }
    /**
     * Specific method to share video post
    */
    static shareVideoPost(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { note, user } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'User not authenticated');
                }
                const result = yield linkedinsharing_service_1.LinkedInSharingService.shareVideoPost(note, user);
                return response_utils_1.ResponseUtil.success(res, 200, result, 'Video post successfully shared to LinkedIn');
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Specific method to share article/document post
     */
    static shareArticlePost(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { note, user } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'User not authenticated');
                }
                const result = yield linkedinsharing_service_1.LinkedInSharingService.shareArticlePost(note, user);
                return response_utils_1.ResponseUtil.success(res, 200, result, 'Article post successfully shared to LinkedIn');
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get access token for LinkedIn
     */
    static getAccessToken(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const user = req.body.user;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'User not authenticated');
                }
                const accessToken = yield linkedinsharing_service_1.LinkedInSharingService.getAccessToken(user);
                return response_utils_1.ResponseUtil.success(res, 200, { accessToken }, 'LinkedIn access token retrieved');
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.LinkedInSharingController = LinkedInSharingController;
exports.default = LinkedInSharingController;
