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
exports.LinkedInService = void 0;
const axios_1 = __importDefault(require("axios"));
const user_model_1 = require("../models/user.model");
const errors_utils_1 = require("../utils/errors.utils");
const auth_service_1 = require("./auth.service");
const config_1 = __importDefault(require("../config/config"));
class LinkedInService {
    constructor(authService = new auth_service_1.AuthService(), userModel = user_model_1.User, appError = errors_utils_1.AppError) {
        this.authService = authService;
        this.userModel = userModel;
        this.appError = appError;
    }
    /**
     * Exchange authorization code for access token
     */
    static getAccessToken(code) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                console.log('Getting access token with code:', code);
                const response = yield axios_1.default.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
                    params: {
                        grant_type: 'authorization_code',
                        code,
                        client_id: config_1.default.linkedin.clientId,
                        client_secret: config_1.default.linkedin.clientSecret,
                        redirect_uri: config_1.default.linkedin.callbackUrl
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                console.log('LinkedIn token response:', response.data);
                return response.data.access_token;
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error)) {
                    console.error('LinkedIn token error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                }
                else {
                    console.error('LinkedIn token error:', error.message);
                }
                throw new errors_utils_1.AppError('Failed to exchange LinkedIn code for token', 400);
            }
        });
    }
    /**
     * Get user profile from LinkedIn using the userinfo endpoint
     */
    static getUserProfile(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                console.log('Getting user profile with token:', accessToken);
                const response = yield axios_1.default.get('https://api.linkedin.com/v2/userinfo', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                console.log('LinkedIn profile response:', response.data);
                if (!response.data || Object.keys(response.data).length === 0) {
                    throw new errors_utils_1.AppError('Empty profile returned from LinkedIn', 400);
                }
                return response.data;
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error)) {
                    console.error('LinkedIn profile error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                }
                else {
                    console.error('LinkedIn profile error:', error.message);
                }
                throw new errors_utils_1.AppError('Failed to fetch LinkedIn profile', 400);
            }
        });
    }
    static authenticate(code) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get access token
                const tokenResponse = yield this.getAccessTokenInitial(code);
                // Get user profile
                const profile = yield this.getUserProfile(tokenResponse.access_token);
                // Find or create user
                let user = yield user_model_1.User.findOne({ email: profile.email });
                if (!user) {
                    // Create new user
                    user = new user_model_1.User({
                        email: profile.email,
                        firstName: profile.given_name,
                        lastName: profile.family_name,
                        role: user_model_1.UserRole.ATTENDEE,
                        password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
                        // socialLinks: {
                        //   linkedinId: profile.sub,
                        //   linkedinAccessToken: tokenResponse.access_token,
                        //   linkedinRefreshToken: tokenResponse.refresh_token, // Assuming refresh token is returned
                        //   linkedinTokenExpiry: new Date(Date.now() + tokenResponse.expires_in * 1000)
                        // }
                        socialLinks: Object.assign(Object.assign({ linkedinId: profile.sub, linkedinAccessToken: tokenResponse.access_token }, (tokenResponse.refresh_token && {
                            linkedinRefreshToken: tokenResponse.refresh_token
                        })), { linkedinTokenExpiry: new Date(Date.now() + tokenResponse.expires_in * 1000) })
                    });
                    yield user.save();
                }
                else {
                    // Update existing user's LinkedIn tokens
                    //   user.socialLinks = {
                    //     ...user.socialLinks,
                    //     linkedinId: profile.sub,
                    //     linkedinAccessToken: tokenResponse.access_token,
                    //     linkedinRefreshToken: tokenResponse.refresh_token, // Assuming refresh token is returned
                    //     linkedinTokenExpiry: new Date(Date.now() + tokenResponse.expires_in * 1000)
                    //   };
                    //   await user.save();
                    // }
                    user.socialLinks = Object.assign(Object.assign(Object.assign(Object.assign({}, user.socialLinks), { linkedinId: profile.sub, linkedinAccessToken: tokenResponse.access_token }), (tokenResponse.refresh_token && {
                        linkedinRefreshToken: tokenResponse.refresh_token
                    })), { linkedinTokenExpiry: new Date(Date.now() + tokenResponse.expires_in * 1000) });
                    yield user.save();
                }
                // Generate tokens
                const tokens = yield auth_service_1.authService.generateTokens(user);
                const userObject = user.toObject();
                console.log('User object:', userObject);
                return { user: userObject, tokens };
            }
            catch (error) {
                console.error('LinkedIn authentication error:', error);
                throw error instanceof errors_utils_1.AppError ? error : new errors_utils_1.AppError(error.message, 400);
            }
        });
    }
    /**
     * Get initial access token with authorization code
     */
    static getAccessTokenInitial(code) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
                    params: {
                        grant_type: 'authorization_code',
                        code,
                        client_id: config_1.default.linkedin.clientId,
                        client_secret: config_1.default.linkedin.clientSecret,
                        redirect_uri: config_1.default.linkedin.callbackUrl
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                console.log('LinkedIn Token Response:', response.data);
                return response.data;
            }
            catch (error) {
                console.error('Token exchange error:', error);
                throw new errors_utils_1.AppError('Failed to exchange LinkedIn code for token', 400);
            }
        });
    }
    /**
     * Refresh LinkedIn access token
     */
    // static async refreshLinkedInToken(user: any): Promise<string> {
    //   try {
    //     // Check if refresh token exists
    //     if (!user.socialLinks?.linkedinRefreshToken) {
    //       throw new AppError('No LinkedIn refresh token found', 401);
    //     }
    //     // Check if token is close to expiry or already expired
    //     const response = await axios.post(
    //       'https://www.linkedin.com/oauth/v2/accessToken',
    //       null,
    //       {
    //         params: {
    //           grant_type: 'refresh_token',
    //           refresh_token: user.socialLinks.linkedinRefreshToken,
    //           client_id: config.linkedin.clientId,
    //           client_secret: config.linkedin.clientSecret
    //         },
    //         headers: {
    //           'Content-Type': 'application/x-www-form-urlencoded'
    //         }
    //       }
    //     );
    //     // Update user with new tokens
    //     user.socialLinks.linkedinAccessToken = response.data.access_token;
    //     user.socialLinks.linkedinTokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
    //     // If a new refresh token is provided, update it
    //     if (response.data.refresh_token) {
    //       user.socialLinks.linkedinRefreshToken = response.data.refresh_token;
    //     }
    //     await user.save();
    //     return response.data.access_token;
    //   } catch (error) {
    //     console.error('LinkedIn token refresh error:', error);
    //     throw new AppError('Failed to refresh LinkedIn access token', 401);
    //   }
    // }
    // In linkedin.auth.service.ts
    // static async refreshLinkedInToken(user: any): Promise<void> {
    //   // Check if refresh token exists
    //   if (!user.socialLinks?.linkedinRefreshToken) {
    //     throw new AppError('No LinkedIn refresh token available. Please reconnect your LinkedIn account.', 401);
    //   }
    //   try {
    //     const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
    //       params: {
    //         grant_type: 'refresh_token',
    //         refresh_token: user.socialLinks.linkedinRefreshToken,
    //         client_id: config.linkedin.clientId,
    //         client_secret: config.linkedin.clientSecret
    //       },
    //       headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded'
    //       }
    //     });
    //     // Update user's tokens
    //     user.socialLinks.linkedinAccessToken = response.data.access_token;
    //     user.socialLinks.linkedinTokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
    //     // Optional: Update refresh token if a new one is provided
    //     if (response.data.refresh_token) {
    //       user.socialLinks.linkedinRefreshToken = response.data.refresh_token;
    //     }
    //     await user.save();
    //   } catch (error) {
    //     console.error('LinkedIn token refresh failed:', error);
    //     throw new AppError('Failed to refresh LinkedIn token. Please reconnect your account.', 401);
    //   }
    // }
    static refreshLinkedInToken(user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Check if refresh token exists
            if (!((_a = user.socialLinks) === null || _a === void 0 ? void 0 : _a.linkedinRefreshToken)) {
                console.warn('No LinkedIn refresh token available for user:', user._id);
                throw new errors_utils_1.AppError('No LinkedIn refresh token available. Please reconnect your LinkedIn account.', 401);
            }
            try {
                const response = yield axios_1.default.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
                    params: {
                        grant_type: 'refresh_token',
                        refresh_token: user.socialLinks.linkedinRefreshToken,
                        client_id: config_1.default.linkedin.clientId,
                        client_secret: config_1.default.linkedin.clientSecret
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                // Log the response to understand what's being returned
                console.log('LinkedIn Refresh Token Response:', response.data);
                // Update user's tokens
                user.socialLinks.linkedinAccessToken = response.data.access_token;
                user.socialLinks.linkedinTokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
                // Optional: Update refresh token if a new one is provided
                if (response.data.refresh_token) {
                    user.socialLinks.linkedinRefreshToken = response.data.refresh_token;
                }
                yield user.save();
            }
            catch (error) {
                console.error('LinkedIn token refresh failed:', error);
                throw new errors_utils_1.AppError('Failed to refresh LinkedIn token. Please reconnect your account.', 401);
            }
        });
    }
    /**
     * Get current valid access token for a user
     */
    //   static async getValidAccessToken(user: any): Promise<string> {
    //     // Check if current token is valid (not expired)
    //     if (user.socialLinks?.linkedinTokenExpiry &&
    //         new Date(user.socialLinks.linkedinTokenExpiry) > new Date()) {
    //       return user.socialLinks.linkedinAccessToken;
    //     }
    //     // If token is expired, refresh it
    //     try {
    //       await this.refreshLinkedInToken(user);
    //       return user.socialLinks.linkedinAccessToken;
    //     } catch (error) {
    //       console.error('Failed to refresh LinkedIn token:', error);
    //       throw new AppError('Failed to refresh LinkedIn token', 401);
    //     }
    //   }
    // }
    /**
    * Get current valid access token for a user
    */
    static getValidAccessToken(user) {
        return __awaiter(this, void 0, void 0, function* () {
            // Simply return the saved access token from the database
            if (!user) {
                throw new errors_utils_1.AppError('User not found', 404);
            }
            // Directly access linkedinAccessToken at the root of socialLinks
            if (!user.socialLinks || !user.socialLinks.linkedinAccessToken) {
                console.log(user, "user object");
                throw new errors_utils_1.AppError('No LinkedIn access token found', 401);
            }
            // Check if current token is valid (not expired)
            if (user.socialLinks.linkedinTokenExpiry &&
                new Date(user.socialLinks.linkedinTokenExpiry) > new Date()) {
                return user.socialLinks.linkedinAccessToken;
            }
            return user.socialLinks.linkedinAccessToken;
        });
    }
}
exports.LinkedInService = LinkedInService;
exports.default = new LinkedInService();
