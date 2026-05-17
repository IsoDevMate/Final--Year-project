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
exports.authService = exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = require("../models/user.model");
const token_model_1 = require("../models/token.model");
const email_service_1 = require("../services/email.service");
const errors_utils_1 = require("../utils/errors.utils");
const config_1 = __importDefault(require("../config/config"));
class AuthService {
    //   async register(userData: RegisterUserDto): Promise<User> {
    //   try {
    //     const existingUser = await User.findOne({ email: userData.email });
    //     if (existingUser) {
    //       throw new AppError('Email already in use', 400);
    //     }
    //     const newUser = new User(userData);
    //     // Hash the password before saving
    //     const saltRounds = 10;
    //     const salt = await bcrypt.genSalt(saltRounds);
    //     newUser.password = await bcrypt.hash(newUser.password, salt);
    //     await newUser.save();
    //     // Remove password from response
    //     const userObject = newUser.toObject();
    //       process.nextTick(() => {
    //         try {
    //     // Send welcome email
    //     sgMail.setApiKey(config.sendgrid.apiKey);
    //     const msg = {
    //       to: newUser.email,
    //       from: config.sendgrid.fromEmail,
    //       subject: 'Welcome to Comfybase',
    //       text: `Hello ${newUser.firstName},\n\nWelcome to Comfybase! We're excited to have you on board.\n\nBest regards,\nThe Comfybase Team`,
    //       html: `<p>Hello ${newUser.firstName},</p><p>Welcome to Comfybase! We're excited to have you on board.</p><p>Best regards,<br>The Comfybase Team</p>`,
    //     }
    //          sgMail.send(msg as MailDataRequired).catch((err: Error) => console.error('Email sending error:', err));
    //         } catch (err) {
    //           console.error('Email preparation error:', err);
    //         }
    //       });
    //       return userObject as User;
    //   } catch (error) {
    //     if (error instanceof AppError) throw error;
    //     console.error('Registration error:', error);
    //     throw new AppError('Registration failed', 500);
    //   }
    // }
    register(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingUser = yield user_model_1.User.findOne({ email: userData.email });
                if (existingUser) {
                    throw new errors_utils_1.AppError('Email already in use', 400);
                }
                const newUser = new user_model_1.User(userData);
                // Hash the password before saving
                const saltRounds = 10;
                const salt = yield bcrypt_1.default.genSalt(saltRounds);
                newUser.password = yield bcrypt_1.default.hash(newUser.password, salt);
                yield newUser.save();
                // Remove password from response
                const userObject = newUser.toObject();
                // Send welcome email asynchronously
                process.nextTick(() => {
                    email_service_1.EmailService.sendWelcomeEmail(newUser.email, {
                        recipientName: newUser.firstName
                    }).catch(err => console.error('Welcome email error:', err));
                });
                return userObject;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError)
                    throw error;
                console.error('Registration error:', error);
                throw new errors_utils_1.AppError('Registration failed', 500);
            }
        });
    }
    forgotPassword(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findOne({ email: data.email });
            if (!user) {
                // Don't reveal if user exists or not
                return;
            }
            // Generate reset token
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            // Hash the token using crypto (SHA-256) for consistent lookup
            const hashedToken = crypto_1.default
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');
            // Save token with expiry (1 hour)
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1);
            yield token_model_1.Token.create({
                userId: user._id,
                token: hashedToken,
                expiresAt: expiryDate
            });
            const resetUrl = `${config_1.default.frontendUrl}/auth/reset-password?token=${resetToken}`;
            // Send reset password email
            yield email_service_1.EmailService.sendPasswordResetEmail(user.email, {
                recipientName: user.firstName,
                resetUrl
            });
        });
    }
    resetPassword(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const hashedToken = crypto_1.default
                    .createHash('sha256')
                    .update(data.token)
                    .digest('hex');
                console.log('Hashed token for lookup:', hashedToken);
                const tokenDoc = yield token_model_1.Token.findOne({
                    token: hashedToken,
                    expiresAt: { $gt: new Date() }
                });
                if (!tokenDoc) {
                    throw new errors_utils_1.AppError('Invalid or expired token', 400);
                }
                const user = yield user_model_1.User.findById(tokenDoc.userId);
                if (!user) {
                    throw new errors_utils_1.AppError('User not found', 404);
                }
                // Hash the new password before saving
                const saltRounds = 10;
                const salt = yield bcrypt_1.default.genSalt(saltRounds);
                const hashedPassword = yield bcrypt_1.default.hash(data.newPassword, salt);
                // Update the user with the hashed password
                user.password = hashedPassword;
                // Save the user with the hashed password
                yield user.save();
                // Delete token
                yield token_model_1.Token.deleteOne({ _id: tokenDoc._id });
                // Send confirmation email
                yield email_service_1.EmailService.sendPasswordResetConfirmationEmail(user.email, {
                    recipientName: user.firstName
                });
            }
            catch (error) {
                console.error('Password reset error:', error);
                throw error;
            }
        });
    }
    login(loginData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield user_model_1.User.findOne({ email: loginData.email });
                if (!user) {
                    throw new errors_utils_1.AppError('Invalid email or password', 401);
                }
                const isPasswordValid = yield bcrypt_1.default.compare(loginData.password, user.password);
                // Check if password is valid
                if (!isPasswordValid) {
                    throw new errors_utils_1.AppError('Invalid email or password', 401);
                }
                const tokens = yield this.generateTokens(user);
                // Remove password from response
                const userObject = user.toObject();
                return { user: userObject, tokens };
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError)
                    throw error;
                console.error('Login error:', error);
                throw new errors_utils_1.AppError('Login failed', 500);
            }
        });
    }
    refreshToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Verify token
                const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.default.jwt.refreshTokenSecret);
                // Find token in database
                const tokenDoc = yield token_model_1.Token.findOne({
                    userId: decoded.userId,
                    token: refreshToken,
                    expiresAt: { $gt: new Date() }
                });
                if (!tokenDoc) {
                    throw new errors_utils_1.AppError('Invalid refresh token', 401);
                }
                // Find user
                const user = yield user_model_1.User.findById(decoded.userId);
                if (!user) {
                    throw new errors_utils_1.AppError('User not found', 404);
                }
                // Generate new tokens
                const tokens = yield this.generateTokens(user);
                // Delete old refresh token
                yield token_model_1.Token.deleteOne({ _id: tokenDoc._id });
                return tokens;
            }
            catch (error) {
                throw new errors_utils_1.AppError('Invalid refresh token', 401);
            }
        });
    }
    generateTokens(user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const payload = {
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                bio: user.bio,
                profileImage: user.profileImage,
                socialLinks: {
                    linkedinId: (_a = user.socialLinks) === null || _a === void 0 ? void 0 : _a.linkedinId,
                    linkedinAccessToken: (_b = user.socialLinks) === null || _b === void 0 ? void 0 : _b.linkedinAccessToken
                }
            };
            const accessToken = jsonwebtoken_1.default.sign(payload, config_1.default.jwt.accessTokenSecret, { expiresIn: config_1.default.jwt.accessTokenExpiration });
            const refreshToken = jsonwebtoken_1.default.sign(payload, config_1.default.jwt.refreshTokenSecret, { expiresIn: config_1.default.jwt.refreshTokenExpiration });
            // Calculate expiry date for refresh token
            const refreshExpiry = new Date();
            refreshExpiry.setSeconds(refreshExpiry.getSeconds() + config_1.default.jwt.refreshTokenExpiration);
            // Save refresh token in database
            yield token_model_1.Token.create({
                userId: user._id,
                token: refreshToken,
                expiresAt: refreshExpiry
            });
            return { accessToken, refreshToken, expiresIn: config_1.default.jwt.accessTokenExpiration };
        });
    }
    // async resetPassword(data: ResetPasswordDto): Promise<void> {
    //   try {
    //     const hashedToken = crypto
    //       .createHash('sha256')
    //       .update(data.token)
    //       .digest('hex');
    //     console.log('Hashed token for lookup:', hashedToken);
    //     const tokenDoc = await Token.findOne({
    //       token: hashedToken,
    //       expiresAt: { $gt: new Date() }
    //     });
    //     if (!tokenDoc) {
    //       throw new AppError('Invalid or expired token', 400);
    //     }
    //     const user = await User.findById(tokenDoc.userId);
    //     if (!user) {
    //       throw new AppError('User not found', 404);
    //     }
    //     // Hash the new password before saving
    //     const saltRounds = 10;
    //     const salt = await bcrypt.genSalt(saltRounds);
    //     const hashedPassword = await bcrypt.hash(data.newPassword, salt);
    //     console.log('Original password:', data.newPassword);
    //     console.log('Hashed password:', hashedPassword);
    //     // Update the user with the hashed password
    //     user.password = hashedPassword;
    //     // Save the user with the hashed password
    //     await user.save();
    //     // Verify the password was hashed correctly
    //     const savedUser = await User.findById(user._id);
    //     // Verify the hashed password can be compared correctly
    //     if (savedUser) {
    //       const passwordMatch = await bcrypt.compare(data.newPassword, savedUser.password);
    //       console.log('Password verification test:', passwordMatch); // Should be true
    //     } else {
    //       console.error('User not found after saving:', user._id);
    //     }
    //     // console.log('userin db  in DB:', savedUser?.password);
    //     // Delete token
    //     await Token.deleteOne({ _id: tokenDoc._id });
    //     // Send confirmation email
    //     sgMail.setApiKey(config.sendgrid.apiKey);
    //     const msg = {
    //       to: user.email,
    //       from: config.sendgrid.fromEmail,
    //       subject: 'Password Reset Confirmation',
    //       text: 'Your password has been successfully reset. If you did not request this change, please contact our support team immediately.',
    //       html: `
    //       <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
    //       <h2 style="color: #4CAF50; text-align: center;">Password Reset Confirmation</h2>
    //       <p>Dear <strong>${user.firstName}</strong>,</p>
    //       <p>Your password has been successfully reset. If you did not request this change, please contact our support team immediately.</p>
    //       <p style="text-align: center; margin-top: 20px;">
    //         <a href="${config.supportUrl}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">Contact Support</a>
    //       </p>
    //       <p>Thank you,</p>
    //       <p style="font-weight: bold;">The Comfybase Team</p>
    //       </div>
    //       `.replace(/\n\s+/g, ''), // Remove extra whitespace and newlines for better rendering
    //     };
    //     await sgMail.send(msg);
    //   } catch (error) {
    //     console.error('Password reset error:', error);
    //     throw error;
    //   }
    // }
    updateProfile(userId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new errors_utils_1.AppError('User not found', 404);
            }
            // Update user fields except email
            Object.assign(user, updateData);
            yield user.save();
            // Remove password from response
            const userObject = user.toObject();
            return userObject;
        });
    }
    getUserProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new errors_utils_1.AppError('User not found', 404);
            }
            // Remove password from response
            const userObject = user.toObject();
            console.log("userObject", userObject);
            return userObject;
        });
    }
    logout(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            // Delete refresh token from database
            const tokenDoc = yield token_model_1.Token.findOne({ token: refreshToken });
            if (tokenDoc) {
                yield token_model_1.Token.deleteOne({
                    _id: tokenDoc._id
                });
                return;
            }
        });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
