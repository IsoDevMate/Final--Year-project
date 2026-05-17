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
class LinkedInController {
    constructor(linkedInService = new linkedin_auth_service_1.LinkedInService()) {
        this.linkedInService = linkedInService;
    }
    /**
     * Initiate LinkedIn authentication
     */
    static getAuthUrl(req, res) {
        const state = crypto_1.default.randomBytes(16).toString('hex');
        const scope = ['openid', 'profile', 'email', 'w_member_social'];
        const responseType = 'code';
        const redirectUri = 'https://final-year-project-5d85.onrender.com/api/v1/auth/linkedin/callback';
        const clientId = config_1.default.linkedin.clientId;
        console.log('LinkedIn auth URL generation:', {
            responseType,
            clientId,
            redirectUri,
            state,
            scope
        });
        // Generate the LinkedIn authentication URL
        // const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=${responseType}&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope.join(' ')}`;
        return response_utils_1.ResponseUtil.success(res, 200, {
            url: `https://www.linkedin.com/oauth/v2/authorization?response_type=${responseType}&client_id=${clientId}&redirect_uri=https://final-year-project-5d85.onrender.com/api/v1/auth/linkedin/callback&state=${state}&scope=openid%20profile%20email%20w_member_social`
        }, 'LinkedIn authentication URL generated successfully');
    }
    /**
     * Handle LinkedIn callback
     */
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
    // static async disconnectLinkedIn(req: Request, res: Response, next: NextFunction) {
    //   try {
    //     const userId = (req.user as any)?.userId;
    //     if (!userId) {
    //       return ResponseUtil.error(res, 401, 'User not authenticated');
    //     }
    //     // Find the user and remove LinkedIn-related information
    //     const user = await User.findByIdAndUpdate(
    //       userId,
    //       {
    //         $unset: {
    //           'socialLinks.linkedin': 1,
    //           'socialLinks.linkedinAccessToken': 1,
    //           'socialLinks.linkedinRefreshToken': 1,
    //           'socialLinks.linkedinTokenExpiry': 1
    //         }
    //       },
    //       { new: true }
    //     );
    //     if (!user) {
    //       return ResponseUtil.error(res, 404, 'User not found');
    //     }
    //     return ResponseUtil.success(res, 200, {
    //       hasLinkedInConnection: false
    //     }, 'LinkedIn account disconnected successfully');
    //   } catch (error) {
    //     next(error);
    //   }
    // }
    static disconnectLinkedIn(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'User not authenticated');
                }
                // Find the user
                const user = yield user_model_1.User.findById(userId);
                if (!user) {
                    return response_utils_1.ResponseUtil.error(res, 404, 'User not found');
                }
                // Check if LinkedIn is connected
                if (!((_b = user.socialLinks) === null || _b === void 0 ? void 0 : _b.linkedinId) && !((_c = user.socialLinks) === null || _c === void 0 ? void 0 : _c.linkedinAccessToken)) {
                    return response_utils_1.ResponseUtil.error(res, 400, 'LinkedIn account not connected');
                }
                // Remove LinkedIn related information
                if (user.socialLinks) {
                    user.socialLinks.linkedinId = undefined;
                    user.socialLinks.linkedinAccessToken = undefined;
                    user.socialLinks.linkedinRefreshToken = undefined;
                    user.socialLinks.linkedinTokenExpiry = undefined;
                }
                // Save the updated user
                yield user.save();
                // Return successful response with a clear status flag
                return response_utils_1.ResponseUtil.success(res, 200, {
                    hasLinkedInConnection: false
                }, 'LinkedIn account disconnected successfully');
            }
            catch (error) {
                console.error('LinkedIn disconnect error:', error);
                next(error instanceof errors_utils_1.AppError ? error : new errors_utils_1.AppError('Failed to disconnect LinkedIn account', 500));
            }
        });
    }
}
exports.LinkedInController = LinkedInController;
exports.default = new LinkedInController();
