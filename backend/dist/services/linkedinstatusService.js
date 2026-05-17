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
exports.LinkedInStatusService = void 0;
const user_model_1 = require("../models/user.model");
const errors_utils_1 = require("../utils/errors.utils");
const linkedin_auth_service_1 = require("./linkedin.auth.service");
class LinkedInStatusService {
    /**
     * Comprehensively check LinkedIn connection status
     */
    static checkLinkedInStatus(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // Find user with detailed social links
                const user = yield user_model_1.User.findById(userId).select('socialLinks');
                if (!user) {
                    throw new errors_utils_1.AppError('User not found', 404);
                }
                // Check if LinkedIn ID exists
                const hasLinkedInId = !!((_a = user.socialLinks) === null || _a === void 0 ? void 0 : _a.linkedinId);
                // Check token validity
                const isTokenValid = this.isLinkedInTokenValid(user);
                return {
                    hasLinkedIn: hasLinkedInId,
                    linkedInId: (_b = user.socialLinks) === null || _b === void 0 ? void 0 : _b.linkedinId,
                    isTokenValid
                };
            }
            catch (error) {
                console.error('LinkedIn status check error:', error);
                throw new errors_utils_1.AppError('Failed to check LinkedIn status', 500);
            }
        });
    }
    /**
     * Validate LinkedIn token
     */
    static isLinkedInTokenValid(user) {
        var _a, _b;
        // Check if tokens exist and are not expired
        const hasAccessToken = !!((_a = user.socialLinks) === null || _a === void 0 ? void 0 : _a.linkedinAccessToken);
        const hasTokenExpiry = (_b = user.socialLinks) === null || _b === void 0 ? void 0 : _b.linkedinTokenExpiry;
        if (!hasAccessToken || !hasTokenExpiry) {
            return false;
        }
        // Check if token is still valid (not expired)
        return new Date(user.socialLinks.linkedinTokenExpiry) > new Date();
    }
    /**
     * Attempt to refresh LinkedIn token if invalid
     */
    static refreshTokenIfNeeded(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // If token is invalid, attempt to refresh
                if (!this.isLinkedInTokenValid(user)) {
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
    // Disconnect LinkedIn account
    static disconnectLinkedIn(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield user_model_1.User.findById(userId);
                if (!user) {
                    throw new errors_utils_1.AppError('User not found', 404);
                }
                // Clear LinkedIn connection data
                if (user.socialLinks) {
                    user.socialLinks.linkedinId = undefined;
                    user.socialLinks.linkedinAccessToken = undefined;
                    user.socialLinks.linkedinRefreshToken = undefined;
                    user.socialLinks.linkedinTokenExpiry = undefined;
                }
                yield user.save();
                return true;
            }
            catch (error) {
                console.error('LinkedIn disconnect error:', error);
                return false;
            }
        });
    }
}
exports.LinkedInStatusService = LinkedInStatusService;
exports.default = LinkedInStatusService;
