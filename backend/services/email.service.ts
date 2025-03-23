import sgMail from '@sendgrid/mail';
import config from '../config/config';
import { AppError } from '../utils/errors.utils';


sgMail.setApiKey(config.sendgrid.apiKey);

export interface EventRegistrationEmailData {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  qrCodeUrl: string;
  attendeeName: string;
}

export class EmailService {
  /**
   * Send event registration confirmation email with QR code
   */
static  async sendEventRegistrationEmail(
    to: string,
    data: EventRegistrationEmailData
  ): Promise<boolean> {
    try {
      const msg = {
        to,
        from: config.sendgrid.fromEmail,
        subject: `Registration Confirmed: ${data.eventName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Event Registration Confirmed</h2>
            <p>Hello ${data.attendeeName},</p>
            <p>Your registration for <strong>${data.eventName}</strong> has been confirmed.</p>

            <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
              <p><strong>Event:</strong> ${data.eventName}</p>
              <p><strong>Date:</strong> ${data.eventDate}</p>
              <p><strong>Location:</strong> ${data.eventLocation}</p>
            </div>

            <p>Your QR code for event check-in is below. Please present this code when you arrive at the event.</p>

            <div style="text-align: center; margin: 30px 0;">
              <img src="${data.qrCodeUrl}" alt="Event QR Code" style="max-width: 250px;">
            </div>

            <p>You can also access this QR code in your ComfyBase account under registered events.</p>

            <p>If you have any questions, please contact the event organizer.</p>

            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              This is an automated message from ComfyBase Event Management System.
            </p>
          </div>
        `
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }
}
