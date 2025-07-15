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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedInController = void 0;
const linkedin_auth_service_1 = require("../services/linkedin.auth.service");
const response_utils_1 = require("../utils/response.utils");
const config_1 = __importDefault(require("../config/config"));
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = require("../models/user.model");
class LinkedInController {
    constructor(linkedInService = new linkedin_auth_service_1.LinkedInService()) {
        this.linkedInService = linkedInService;
    }
    /**
     * Initiate LinkedIn authentication
     */
    static getAuthUrl(req, res) {
        const state = crypto_1.default.randomBytes(16).toString('hex'); // More secure random state
        const scope = ['openid', 'profile', 'email', 'w_member_social'];
        const responseType = 'code';
        const redirectUri = config_1.default.linkedin.callbackUrl;
        const clientId = config_1.default.linkedin.clientId;
        const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope.join(' ')}`;
        return response_utils_1.ResponseUtil.success(res, 200, { url: linkedInAuthUrl }, 'LinkedIn authentication URL');
    }
    ;
    /**
     * Handle LinkedIn callback
     */
    // In linkedin.controller.ts
    static handleCallback(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { code, state } = req.query;
            try {
                console.log('LinkedIn callback received:', req.query);
                if (!code) {
                    return response_utils_1.ResponseUtil.error(res, 400, 'Authorization code not provided');
                }
                const result = yield linkedin_auth_service_1.LinkedInService.authenticate(code.toString());
                // Build the redirect URL with properly encoded parameters
                const redirectUrl = new URL(`${config_1.default.frontendUrl}/auth/linkedin/callback`);
                redirectUrl.searchParams.append('accessToken', result.tokens.accessToken);
                redirectUrl.searchParams.append('refreshToken', result.tokens.refreshToken);
                redirectUrl.searchParams.append('linkedinConnected', 'true');
                // Add user data to the redirect URL
                redirectUrl.searchParams.append('user', JSON.stringify(result.user));
                console.log('Redirect URL:', redirectUrl.toString());
                res.redirect(redirectUrl.toString());
            }
            catch (error) {
                console.error('LinkedIn callback error:', error);
                // Redirect to login page with error message
                const loginUrl = new URL(`${config_1.default.frontendUrl}/auth/login`);
                loginUrl.searchParams.append('error', 'LinkedIn authentication failed');
                res.redirect(loginUrl.toString());
            }
        });
    }
    /**
      * Disconnect LinkedIn account
      */
    static disconnectLinkedIn(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'User not authenticated');
                }
                // Find the user and remove LinkedIn-related information
                const user = yield user_model_1.User.findByIdAndUpdate(userId, {
                    $unset: {
                        'socialLinks.linkedin': 1,
                        'socialLinks.linkedinAccessToken': 1,
                        'socialLinks.linkedinRefreshToken': 1,
                        'socialLinks.linkedinTokenExpiry': 1
                    }
                }, { new: true });
                if (!user) {
                    return response_utils_1.ResponseUtil.error(res, 404, 'User not found');
                }
                return response_utils_1.ResponseUtil.success(res, 200, {
                    hasLinkedInConnection: false
                }, 'LinkedIn account disconnected successfully');
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.LinkedInController = LinkedInController;
exports.default = new LinkedInController();
