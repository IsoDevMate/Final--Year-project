import nodemailer from 'nodemailer';
import config from '../config/config';

// Common interface for all email data
interface EmailDataBase {
  recipientName: string;
}

export interface EventRegistrationEmailData extends EmailDataBase {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  qrCodeUrl: string;
  attendeeName: string;
}

export interface WelcomeEmailData extends EmailDataBase {}
export interface PasswordResetEmailData extends EmailDataBase { resetUrl: string; }
export interface PasswordResetConfirmationEmailData extends EmailDataBase {}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.user,
    pass: config.email.appPassword,
  },
});

const primaryColor = '#0ABAB5';
const fontFamily = 'Arial, sans-serif';

function header(title: string) {
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

function btn(url: string, label: string) {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;padding:10px 24px;background:${primaryColor};color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">${label}</a>
  </div>`;
}

export class EmailService {
  static async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: `"eventbase" <${config.email.user}>`,
        to,
        subject: 'Welcome to eventbase 🎫',
        html: `${header('Welcome to eventbase')}
          <p>Hello ${data.recipientName},</p>
          <p>Welcome to eventbase! We're excited to have you on board.</p>
          ${btn(`${config.frontendUrl}/dashboard`, 'Go to Dashboard')}
          <p>The eventbase Team</p>
          ${footer()}`,
      });
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  static async sendPasswordResetEmail(to: string, data: PasswordResetEmailData): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: `"eventbase" <${config.email.user}>`,
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
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  static async sendPasswordResetConfirmationEmail(to: string, data: PasswordResetConfirmationEmailData): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: `"eventbase" <${config.email.user}>`,
        to,
        subject: 'Password Reset Successful',
        html: `${header('Password Reset Successful')}
          <p>Hello ${data.recipientName},</p>
          <p>Your password has been successfully reset.</p>
          <p>If you did not make this change, contact support immediately.</p>
          <p>The eventbase Team</p>
          ${footer()}`,
      });
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  static async sendEventRegistrationEmail(to: string, data: EventRegistrationEmailData): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: `"eventbase" <${config.email.user}>`,
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
          ${btn(`${config.frontendUrl}/events`, 'View Your Events')}
          <p>The eventbase Team</p>
          ${footer()}`,
      });
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }
}
