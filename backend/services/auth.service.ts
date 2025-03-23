import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { User, UserRole } from '../models/user.model';
import { Token } from '../models/token.model';
// import { Token } from '../models/token.model';
import {
  RegisterUserDto,
  LoginUserDto,
  AuthTokens,
  TokenPayload,
  ResetPasswordDto,
  ForgotPasswordDto
} from '../interfaces/auth.interface';
import { AppError } from '../utils/errors.utils';
import config from '../config/config';
import QRCode from 'qrcode';
import { ResponseUtil } from '../utils/response.utils';
const sgMail = require('@sendgrid/mail');

export class AuthService {
  async register(userData: RegisterUserDto): Promise<User> {
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    const newUser = new User(userData);

    // Hash the password before saving
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    newUser.password = await bcrypt.hash(newUser.password, salt);

    await newUser.save();

    // Remove password from response
    const userObject = newUser.toObject();

    return userObject as User;
  }

  async login(loginData: LoginUserDto): Promise<{ user: User, tokens: AuthTokens }> {
    const user = await User.findOne({ email: loginData.email });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);

    // Check if password is valid
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = await this.generateTokens(user);

    // Remove password from response
    const userObject = user.toObject();

    return { user: userObject as User, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshTokenSecret as string) as TokenPayload;

      // Find token in database
      const tokenDoc = await Token.findOne({
        userId: decoded.userId,
        token: refreshToken,
        expiresAt: { $gt: new Date() }
      });

      if (!tokenDoc) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Find user
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Delete old refresh token
      await Token.deleteOne({ _id: tokenDoc._id });

      return tokens;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async generateTokens(user: User): Promise<AuthTokens> {
    const payload: TokenPayload = {
      userId: (user._id as string).toString(),
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(
      payload,
      config.jwt.accessTokenSecret as string,
      { expiresIn: config.jwt.accessTokenExpiration as number }
    );

    const refreshToken = jwt.sign(
      payload,
      config.jwt.refreshTokenSecret as string,
      { expiresIn: config.jwt.refreshTokenExpiration as number }
    );

    // Calculate expiry date for refresh token
    const refreshExpiry = new Date();
    refreshExpiry.setSeconds(refreshExpiry.getSeconds() + config.jwt.refreshTokenExpiration);

    // Save refresh token in database
    await Token.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: refreshExpiry
    });

    return { accessToken, refreshToken, expiresIn: config.jwt.accessTokenExpiration };
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    const user = await User.findOne({ email: data.email });

    if (!user) {
      // Don't reveal if user exists or not
      return
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save token with expiry (1 hour)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    await Token.create({
      userId: user._id,
      token: hashedToken,
      expiresAt: expiryDate
    });

    // In a real application, send email with reset link
    sgMail.setApiKey(config.sendgrid.apiKey);

    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    const msg = {
      to: user.email,
      from: config.sendgrid.fromEmail,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Please use the following link to reset your password: ${resetUrl}`,
      html: `<p>You requested a password reset. Please use the following link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    };

    await sgMail.send(msg);
    // For now, just return success
  }


  async resetPassword(data: ResetPasswordDto): Promise<void> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(data.token)
      .digest('hex');

    const tokenDoc = await Token.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      throw new AppError('Invalid or expired token', 400);
    }

    const user = await User.findById(tokenDoc.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update password
    user.password = data.newPassword;
    await user.save();

    // Delete token
    await Token.deleteOne({ _id: tokenDoc._id });

    // In a real application, send confirmation email
    sgMail.setApiKey(config.sendgrid.apiKey);

    const msg = {
      to: user.email,
      from: config.sendgrid.fromEmail,
      subject: 'Password Reset Confirmation',
      text: 'Your password has been successfully reset.',
      html: '<strong>Your password has been successfully reset.</strong>',
    };

    await sgMail.send(msg);
  }

  async generateQRCode(userId: string,eventId:string): Promise<string> {
    // Generate unique token for QR code
    const qrToken = jwt.sign(
      { userId, eventId },
      config.jwt.accessTokenSecret as string,
      { expiresIn: '1d' }
    );

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrToken);
    return qrCodeDataUrl;
  }

  async logout(refreshToken: string): Promise<void> {
    // Delete refresh token from database
    const tokenDoc = await Token.findOne({ token: refreshToken });

    if (tokenDoc) {
      await Token.deleteOne({
        _id: tokenDoc._id
      });
      return;
    }
  }



  async verifyQRCode(qrToken: string): Promise<{ userId: string, eventId: string }> {
    try {
      const decoded = jwt.verify(qrToken, config.jwt.accessTokenSecret as string) as { userId: string, eventId: string };

      // Optionally, you can check if the user and event exist in your database
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      // const event = await Event.findById(decoded.eventId);
      // if (!event) {
      //   throw new AppError('Event not found', 404);
      // }
      // Optionally, you can check if the QR code has expired
      const currentTime = Math.floor(Date.now() / 1000);
      // const tokenExpirationTime = decoded.
      // if (currentTime > tokenExpirationTime) {
      //   throw new AppError('QR code has expired', 401);
      // }

      return { userId: decoded.userId, eventId: decoded.eventId };
    } catch (error) {
      throw new AppError('Invalid QR code', 401);
    }
  }

}

export const authService = new AuthService();
