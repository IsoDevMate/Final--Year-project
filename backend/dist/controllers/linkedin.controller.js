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
const errors_utils_1 = require("../utils/errors.utils");
const REDIRECT_URI = 'https://final-year-project-jy2j.onrender.com/api/v1/auth/linkedin/callback';
class LinkedInController {
    constructor(linkedInService = new linkedin_auth_service_1.LinkedInService()) {
        this.linkedInService = linkedInService;
    }
    static getAuthUrl(req, res) {
        const state = crypto_1.default.randomBytes(16).toString('hex');
        return response_utils_1.ResponseUtil.success(res, 200, {
            url: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config_1.default.linkedin.clientId}&redirect_uri=${REDIRECT_URI}&state=${state}&scope=openid%20profile%20email%20w_member_social`
        }, 'LinkedIn authentication URL generated successfully');
    }
    static handleCallback(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { code } = req.query;
            try {
                if (!code)
                    return response_utils_1.ResponseUtil.error(res, 400, 'Authorization code not provided');
                const result = yield linkedin_auth_service_1.LinkedInService.authenticate(code.toString());
                const redirectUrl = new URL(`${config_1.default.frontendUrl}/auth/linkedin/callback`);
                redirectUrl.searchParams.append('accessToken', result.tokens.accessToken);
                redirectUrl.searchParams.append('refreshToken', result.tokens.refreshToken);
                redirectUrl.searchParams.append('linkedinConnected', 'true');
                redirectUrl.searchParams.append('user', JSON.stringify(result.user));
                return res.redirect(redirectUrl.toString());
            }
            catch (error) {
                console.error('LinkedIn callback error:', error);
                const loginUrl = new URL(`${config_1.default.frontendUrl}/auth/login`);
                loginUrl.searchParams.append('error', 'LinkedIn authentication failed');
                return res.redirect(loginUrl.toString());
            }
        });
    }
    static disconnectLinkedIn(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId)
                    return response_utils_1.ResponseUtil.error(res, 401, 'User not authenticated');
                const user = yield user_model_1.User.findById(userId);
                if (!user)
                    return response_utils_1.ResponseUtil.error(res, 404, 'User not found');
                if (user.socialLinks) {
                    user.socialLinks.linkedinId = undefined;
                    user.socialLinks.linkedinAccessToken = undefined;
                    user.socialLinks.linkedinRefreshToken = undefined;
                    user.socialLinks.linkedinTokenExpiry = undefined;
                }
                yield user.save();
                return response_utils_1.ResponseUtil.success(res, 200, { hasLinkedInConnection: false }, 'LinkedIn account disconnected successfully');
            }
            catch (error) {
                next(error instanceof errors_utils_1.AppError ? error : new errors_utils_1.AppError('Failed to disconnect LinkedIn account', 500));
            }
        });
    }
}
exports.LinkedInController = LinkedInController;
exports.default = new LinkedInController();
