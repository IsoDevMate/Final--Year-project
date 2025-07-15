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
exports.AuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const response_utils_1 = require("../utils/response.utils");
const config_1 = __importDefault(require("../config/config"));
const user_model_1 = require("../models/user.model");
class AuthMiddleware {
    static verifyToken(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Access token is required');
                }
                const token = authHeader.split(' ')[1];
                try {
                    if (!config_1.default.jwt.accessTokenSecret) {
                        return response_utils_1.ResponseUtil.error(res, 500, 'JWT secret is not defined');
                    }
                    const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.accessTokenSecret);
                    // Check if user still exists
                    const user = yield user_model_1.User.findById(decoded.userId);
                    if (!user) {
                        return response_utils_1.ResponseUtil.error(res, 401, 'User no longer exists');
                    }
                    // Attach user info to request
                    req.user = {
                        id: decoded.userId,
                        userId: decoded.userId,
                        email: decoded.email,
                        role: decoded.role,
                        firstName: decoded.firstName,
                        lastName: decoded.lastName,
                        // socialLinks is not part of the User type
                        socialLinks: decoded.socialLinks || null,
                        profileImage: user.profileImage,
                        bio: user.bio,
                        phoneNumber: user.phoneNumber,
                        createdAt: user.createdAt,
                    };
                    next();
                }
                catch (error) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Invalid or expired token');
                }
            }
            catch (error) {
                next(error);
            }
        });
    }
    // Check if user has required role
    static hasRole(roles) {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                // Type assertion to ensure req.user has the role property
                const user = req.user;
                if (!roles.includes(user.role)) {
                    return response_utils_1.ResponseUtil.error(res, 403, 'Insufficient permissions');
                }
                next();
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.AuthMiddleware = AuthMiddleware;
exports.default = new AuthMiddleware();
