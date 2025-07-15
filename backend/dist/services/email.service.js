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
const mail_1 = __importDefault(require("@sendgrid/mail"));
const config_1 = __importDefault(require("../config/config"));
mail_1.default.setApiKey(config_1.default.sendgrid.apiKey);
class EmailService {
    /**
     * Send event registration confirmation email with QR code
     */
    static sendEventRegistrationEmail(to, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const msg = {
                    to: to,
                    from: config_1.default.sendgrid.fromEmail,
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
                yield mail_1.default.send(msg);
                return true;
            }
            catch (error) {
                console.error('Email sending error:', error);
                return false;
            }
        });
    }
}
exports.EmailService = EmailService;
