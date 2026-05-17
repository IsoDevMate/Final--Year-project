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
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config/config"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: config_1.default.email.user,
        pass: config_1.default.email.appPassword,
    },
});
const primaryColor = '#0ABAB5';
const fontFamily = 'Arial, sans-serif';
function header(title) {
    return `<div style="font-family:${fontFamily};max-width:600px;margin:0 auto;">
    <div style="background:${primaryColor};padding:20px;text-align:center;">
      <h2 style="color:#fff;margin:0;">${title}</h2>
    </div>
    <div style="padding:20px;border:1px solid #ddd;border-top:none;background:#f9f9f9;">`;
}
function footer() {
    return `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#666;text-align:center;">
      <p>© ${new Date().getFullYear()} eventbase. All rights reserved.</p>
    </div></div></div>`;
}
function btn(url, label) {
    return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;padding:10px 24px;background:${primaryColor};color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">${label}</a>
  </div>`;
}
class EmailService {
    static sendWelcomeEmail(to, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield transporter.sendMail({
                    from: `"eventbase" <${config_1.default.email.user}>`,
                    to,
                    subject: 'Welcome to eventbase 🎫',
                    html: `${header('Welcome to eventbase')}
          <p>Hello ${data.recipientName},</p>
          <p>Welcome to eventbase! We're excited to have you on board.</p>
          ${btn(`${config_1.default.frontendUrl}/dashboard`, 'Go to Dashboard')}
          <p>The eventbase Team</p>
          ${footer()}`,
                });
                console.log(`[Email] ✅ Welcome email sent to ${to}`);
                return true;
            }
            catch (error) {
                console.error(`[Email] ❌ Failed to send welcome email to ${to} — ${error === null || error === void 0 ? void 0 : error.message}`);
                return false;
            }
        });
    }
    static sendPasswordResetEmail(to, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield transporter.sendMail({
                    from: `"eventbase" <${config_1.default.email.user}>`,
                    to,
                    subject: 'Password Reset Request',
                    html: `${header('Password Reset Request')}
          <p>Hello ${data.recipientName},</p>
          <p>You requested a password reset. This link expires in 1 hour.</p>
          ${btn(data.resetUrl, 'Reset Password')}
          <p>If you did not request this, please ignore this email.</p>
          <p>The eventbase Team</p>
          ${footer()}`,
                });
                console.log(`[Email] ✅ Password reset email sent to ${to}`);
                return true;
            }
            catch (error) {
                console.error(`[Email] ❌ Failed to send password reset email to ${to} — ${error === null || error === void 0 ? void 0 : error.message}`);
                return false;
            }
        });
    }
    static sendPasswordResetConfirmationEmail(to, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield transporter.sendMail({
                    from: `"eventbase" <${config_1.default.email.user}>`,
                    to,
                    subject: 'Password Reset Successful',
                    html: `${header('Password Reset Successful')}
          <p>Hello ${data.recipientName},</p>
          <p>Your password has been successfully reset.</p>
          <p>If you did not make this change, contact support immediately.</p>
          <p>The eventbase Team</p>
          ${footer()}`,
                });
                console.log(`[Email] ✅ Password reset confirmation sent to ${to}`);
                return true;
            }
            catch (error) {
                console.error(`[Email] ❌ Failed to send reset confirmation to ${to} — ${error === null || error === void 0 ? void 0 : error.message}`);
                return false;
            }
        });
    }
    static sendEventRegistrationEmail(to, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield transporter.sendMail({
                    from: `"eventbase" <${config_1.default.email.user}>`,
                    to,
                    subject: `Registration Confirmed: ${data.eventName}`,
                    html: `${header('Event Registration Confirmed')}
          <p>Hello ${data.recipientName},</p>
          <p>Your registration for <strong>${data.eventName}</strong> is confirmed.</p>
          <div style="margin:16px 0;padding:14px;border:1px solid #ddd;border-radius:6px;background:#fff;">
            <p><strong>Event:</strong> ${data.eventName}</p>
            <p><strong>Date:</strong> ${data.eventDate}</p>
            <p><strong>Location:</strong> ${data.eventLocation}</p>
          </div>
          <p>Present the QR code below at check-in:</p>
          <div style="text-align:center;margin:20px 0;">
            <img src="${data.qrCodeUrl}" alt="QR Code" style="max-width:220px;">
          </div>
          ${btn(`${config_1.default.frontendUrl}/events`, 'View Your Events')}
          <p>The eventbase Team</p>
          ${footer()}`,
                });
                console.log(`[Email] ✅ Event registration email sent to ${to} for "${data.eventName}"`);
                return true;
            }
            catch (error) {
                console.error(`[Email] ❌ Failed to send event registration email to ${to} — ${error === null || error === void 0 ? void 0 : error.message}`);
                return false;
            }
        });
    }
}
exports.EmailService = EmailService;
