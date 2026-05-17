import { BrevoClient } from '@getbrevo/brevo';
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

// Brevo HTTP API (works on Render — no SMTP ports needed)
const brevo = new BrevoClient({ apiKey: config.sendgrid.apiKey });

// Nodemailer SMTP fallback (local dev only)
const smtpTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: config.email.user, pass: config.email.appPassword },
});

async function sendEmail(to: string, subject: string, html: string, attachments?: any[]): Promise<void> {
  const senderEmail = config.sendgrid.senderEmail || config.email.user;
  const senderName = config.sendgrid.senderName || 'eventbase';

  if (config.email.user && config.email.appPassword) {
    // Primary: Gmail SMTP (works locally and on paid Render plans)
    await smtpTransporter.sendMail({
      from: `"${senderName}" <${config.email.user}>`,
      to, subject, html, attachments,
    });
  } else if (config.sendgrid.apiKey) {
    // Fallback: Brevo HTTP API (use when SMTP is blocked e.g. Render free tier)
    let htmlContent = html;
    if (attachments?.length) {
      htmlContent = html.replace('cid:qrcode@eventbase', `data:image/png;base64,${attachments[0].content.toString('base64')}`);
    }
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent,
    });
  } else {
    throw new Error('No email provider configured');
  }
}

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
      await sendEmail(to, 'Welcome to eventbase 🎫', `${header('Welcome to eventbase')}
          <p>Hello ${data.recipientName},</p>
          <p>Welcome to eventbase! We're excited to have you on board.</p>
          ${btn(`${config.frontendUrl}/dashboard`, 'Go to Dashboard')}
          <p>The eventbase Team</p>
          ${footer()}`);
      console.log(`[Email] ✅ Welcome email sent to ${to}`);
      return true;
    } catch (error: any) {
      console.error(`[Email] ❌ Failed to send welcome email to ${to} — ${error?.message}`);
      return false;
    }
  }

  static async sendPasswordResetEmail(to: string, data: PasswordResetEmailData): Promise<boolean> {
    try {
      await sendEmail(to, 'Password Reset Request', `${header('Password Reset Request')}
          <p>Hello ${data.recipientName},</p>
          <p>You requested a password reset. This link expires in 1 hour.</p>
          ${btn(data.resetUrl, 'Reset Password')}
          <p>If you did not request this, please ignore this email.</p>
          <p>The eventbase Team</p>
          ${footer()}`);
      console.log(`[Email] ✅ Password reset email sent to ${to}`);
      return true;
    } catch (error: any) {
      console.error(`[Email] ❌ Failed to send password reset email to ${to} — ${error?.message}`);
      return false;
    }
  }

  static async sendPasswordResetConfirmationEmail(to: string, data: PasswordResetConfirmationEmailData): Promise<boolean> {
    try {
      await sendEmail(to, 'Password Reset Successful', `${header('Password Reset Successful')}
          <p>Hello ${data.recipientName},</p>
          <p>Your password has been successfully reset.</p>
          <p>If you did not make this change, contact support immediately.</p>
          <p>The eventbase Team</p>
          ${footer()}`);
      console.log(`[Email] ✅ Password reset confirmation sent to ${to}`);
      return true;
    } catch (error: any) {
      console.error(`[Email] ❌ Failed to send reset confirmation to ${to} — ${error?.message}`);
      return false;
    }
  }

  static async sendEventRegistrationEmail(to: string, data: EventRegistrationEmailData): Promise<boolean> {
    try {
      const isDataUrl = data.qrCodeUrl.startsWith('data:');
      const attachments = isDataUrl ? [{
        filename: 'qrcode.png',
        content: Buffer.from(data.qrCodeUrl.split(',')[1], 'base64'),
        cid: 'qrcode@eventbase',
      }] : [];
      const qrImgSrc = isDataUrl ? 'cid:qrcode@eventbase' : data.qrCodeUrl;

      await sendEmail(
        to,
        `Registration Confirmed: ${data.eventName}`,
        `${header('Event Registration Confirmed')}
          <p>Hello ${data.recipientName},</p>
          <p>Your registration for <strong>${data.eventName}</strong> is confirmed.</p>
          <div style="margin:16px 0;padding:14px;border:1px solid #ddd;border-radius:6px;background:#fff;">
            <p><strong>Event:</strong> ${data.eventName}</p>
            <p><strong>Date:</strong> ${data.eventDate}</p>
            <p><strong>Location:</strong> ${data.eventLocation}</p>
          </div>
          <p>Present the QR code below at check-in:</p>
          <div style="text-align:center;margin:20px 0;">
            <img src="${qrImgSrc}" alt="QR Code" style="max-width:220px;">
          </div>
          ${btn(`${config.frontendUrl}/events`, 'View Your Events')}
          <p>The eventbase Team</p>
          ${footer()}`,
        attachments,
      );
      console.log(`[Email] ✅ Event registration email sent to ${to} for "${data.eventName}"`);
      return true;
    } catch (error: any) {
      console.error(`[Email] ❌ Failed to send event registration email to ${to} — ${error?.message}`);
      return false;
    }
  }
}
