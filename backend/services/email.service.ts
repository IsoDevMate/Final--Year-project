// import sgMail from '@sendgrid/mail';
// import config from '../config/config';
// import { AppError } from '../utils/errors.utils';


// sgMail.setApiKey(config.sendgrid.apiKey);

// export interface EventRegistrationEmailData {
//   eventName: string;
//   eventDate: string;
//   eventLocation: string;
//   qrCodeUrl: string;
//   attendeeName: string;
// }

// export class EmailService {
//   /**
//    * Send event registration confirmation email with QR code
//    */
// static  async sendEventRegistrationEmail(
//     to: string,
//     data: EventRegistrationEmailData
//   ): Promise<boolean> {
//     try {
//       const msg = {
//         to: to,
//         from: config.sendgrid.fromEmail,
//         subject: `Registration Confirmed: ${data.eventName}`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <h2>Event Registration Confirmed</h2>
//             <p>Hello ${data.attendeeName},</p>
//             <p>Your registration for <strong>${data.eventName}</strong> has been confirmed.</p>

//             <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
//               <p><strong>Event:</strong> ${data.eventName}</p>
//               <p><strong>Date:</strong> ${data.eventDate}</p>
//               <p><strong>Location:</strong> ${data.eventLocation}</p>
//             </div>

//             <p>Your QR code for event check-in is below. Please present this code when you arrive at the event.</p>

//             <div style="text-align: center; margin: 30px 0;">
//               <img src="${data.qrCodeUrl}" alt="Event QR Code" style="max-width: 250px;">
//             </div>

//             <p>You can also access this QR code in your ComfyBase account under registered events.</p>

//             <p>If you have any questions, please contact the event organizer.</p>

//             <p style="margin-top: 30px; font-size: 12px; color: #666;">
//               This is an automated message from ComfyBase Event Management System.
//             </p>
//           </div>
//         `
//       };

//       await sgMail.send(msg);
//       return true;
//     } catch (error) {
//       console.error('Email sending error:', error);
//       return false;
//     }
//   }
// }


import sgMail, { MailDataRequired } from '@sendgrid/mail';
import config from '../config/config';
import { AppError } from '../utils/errors.utils';

sgMail.setApiKey(config.sendgrid.apiKey);

// Common interface for all email data
interface EmailDataBase {
  recipientName: string;
}

// Specific email data interfaces
export interface EventRegistrationEmailData extends EmailDataBase {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  qrCodeUrl: string;
  attendeeName: string;
}

export interface WelcomeEmailData extends EmailDataBase {
  // Any additional fields specific to welcome emails
}

export interface PasswordResetEmailData extends EmailDataBase {
  resetUrl: string;
}

export interface PasswordResetConfirmationEmailData extends EmailDataBase {
  // Any additional fields specific to reset confirmation

}

export class EmailService {
  // Common styling variables
  private static readonly primaryColor = '#5E35B1'; // ComfyBase purple from UI
  private static readonly secondaryColor = '#4CAF50'; // Green accent
  private static readonly bgColor = '#f9f9f9'; // Light background
  private static readonly fontFamily = 'Arial, sans-serif';

  // Email header and footer template parts
  private static getEmailHeader(title: string): string {
    return `
    <div style="font-family: ${this.fontFamily}; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
      <div style="background-color: ${this.primaryColor}; padding: 20px; text-align: center;">
        <img src="${config.frontendUrl}/assets/logo-white.png" alt="ComfyBase" style="height: 40px; margin-bottom: 10px;">
        <h2 style="color: white; margin: 0;">${title}</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none; background-color: ${this.bgColor};">
    `;
  }

  private static getEmailFooter(): string {
    return `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center;">
          <p>© ${new Date().getFullYear()} ComfyBase. All rights reserved.</p>
          <p>If you have any questions, please <a href="${config.supportUrl}" style="color: ${this.primaryColor};">contact our support team</a>.</p>
        </div>
      </div>
    </div>
    `;
  }

  private static getButtonStyle(): string {
    return `display: inline-block; padding: 10px 20px; color: #fff; background-color: ${this.primaryColor}; text-decoration: none; border-radius: 5px; font-weight: bold;`;
  }

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(
    to: string,
    data: WelcomeEmailData
  ): Promise<boolean> {
    try {
      const html = `
        ${this.getEmailHeader('Welcome to ComfyBase')}
        <p>Hello ${data.recipientName},</p>
        <p>Welcome to ComfyBase! We're excited to have you on board.</p>
        <p>ComfyBase helps you organize your notes, manage events, and collaborate with others. Get started by exploring your dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.frontendUrl}/dashboard" style="${this.getButtonStyle()}">Go to Dashboard</a>
        </div>
        <p>Thank you for joining us!</p>
        <p style="font-weight: bold;">The ComfyBase Team</p>
        ${this.getEmailFooter()}
      `;

      const msg = {
        to,
        from: config.sendgrid.fromEmail,
        subject: 'Welcome to ComfyBase',
        text: `Hello ${data.recipientName},\n\nWelcome to ComfyBase! We're excited to have you on board.\n\nBest regards,\nThe ComfyBase Team`,
        html: html.replace(/\n\s+/g, ''), // Remove extra whitespace for better rendering
      };

      await sgMail.send(msg as MailDataRequired);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  /**
   * Send password reset email with link
   */
  static async sendPasswordResetEmail(
    to: string,
    data: PasswordResetEmailData
  ): Promise<boolean> {
    try {
      const html = `
        ${this.getEmailHeader('Password Reset Request')}
        <p>Hello ${data.recipientName},</p>
        <p>You recently requested to reset your password for your ComfyBase account. Use the button below to reset it.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" style="${this.getButtonStyle()}">Reset Password</a>
        </div>
        <p>If you did not request a password reset, please ignore this email or contact our support team.</p>
        <p>This password reset link is only valid for the next hour.</p>
        <p>Thank you,</p>
        <p style="font-weight: bold;">The ComfyBase Team</p>
        ${this.getEmailFooter()}
      `;

      const msg = {
        to,
        from: config.sendgrid.fromEmail,
        subject: 'Password Reset Request',
        text: `Hello ${data.recipientName},\n\nYou requested a password reset. Please use the following link to reset your password: ${data.resetUrl}\n\nIf you did not request this, please ignore this email or contact our support team.\n\nThank you,\nThe ComfyBase Team`,
        html: html.replace(/\n\s+/g, ''),
      };

      await sgMail.send(msg as MailDataRequired);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  /**
   * Send password reset confirmation email
   */
  static async sendPasswordResetConfirmationEmail(
    to: string,
    data: PasswordResetConfirmationEmailData
  ): Promise<boolean> {
    try {
      const html = `
        ${this.getEmailHeader('Password Reset Confirmation')}
        <p>Hello ${data.recipientName},</p>
        <p>Your password has been successfully reset.</p>
        <p>If you did not request this change, please contact our support team immediately.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.supportUrl}" style="${this.getButtonStyle()}">Contact Support</a>
        </div>
        <p>Thank you,</p>
        <p style="font-weight: bold;">The ComfyBase Team</p>
        ${this.getEmailFooter()}
      `;

      const msg = {
        to,
        from: config.sendgrid.fromEmail,
        subject: 'Password Reset Confirmation',
        text: `Hello ${data.recipientName},\n\nYour password has been successfully reset. If you did not request this change, please contact our support team immediately.\n\nThank you,\nThe ComfyBase Team`,
        html: html.replace(/\n\s+/g, ''),
      };

      await sgMail.send(msg as MailDataRequired);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  /**
   * Send event registration confirmation email with QR code
   */
  static async sendEventRegistrationEmail(
    to: string,
    data: EventRegistrationEmailData
  ): Promise<boolean> {
    try {
      const html = `
        ${this.getEmailHeader('Event Registration Confirmed')}
        <p>Hello ${data.recipientName},</p>
        <p>Your registration for <strong>${data.eventName}</strong> has been confirmed.</p>

        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: white;">
          <p><strong>Event:</strong> ${data.eventName}</p>
          <p><strong>Date:</strong> ${data.eventDate}</p>
          <p><strong>Location:</strong> ${data.eventLocation}</p>
        </div>

        <p>Your QR code for event check-in is below. Please present this code when you arrive at the event.</p>

        <div style="text-align: center; margin: 30px 0;">
          <img src="${data.qrCodeUrl}" alt="Event QR Code" style="max-width: 250px;">
        </div>

        <p>You can also access this QR code in your ComfyBase account under Registered Events.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.frontendUrl}/events" style="${this.getButtonStyle()}">View Your Events</a>
        </div>

        <p>If you have any questions, please contact the event organizer.</p>
        ${this.getEmailFooter()}
      `;

      const msg = {
        to,
        from: config.sendgrid.fromEmail,
        subject: `Registration Confirmed: ${data.eventName}`,
        text: `Hello ${data.recipientName},\n\nYour registration for ${data.eventName} has been confirmed.\n\nEvent: ${data.eventName}\nDate: ${data.eventDate}\nLocation: ${data.eventLocation}\n\nPlease present your QR code when you arrive at the event.\n\nThank you,\nThe ComfyBase Team`,
        html: html.replace(/\n\s+/g, ''),
      };

      await sgMail.send(msg as MailDataRequired);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }
}
