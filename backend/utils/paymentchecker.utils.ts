
import { MpesaPayment, MpesaPaymentStatus } from '../models/mpesapayment.model';
import { MpesaService } from '../services/mpesaApi.service';
import { EventService } from '../services/event.service';
import { Types } from 'mongoose';

export class PaymentChecker {
  private mpesaService: MpesaService;
  private eventService: EventService;
  private checkIntervalMinutes: number;
  private maxPendingHours: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(checkIntervalMinutes = 15, maxPendingHours = 6) {
    this.mpesaService = new MpesaService();
    this.eventService = new EventService();
    this.checkIntervalMinutes = checkIntervalMinutes;
    this.maxPendingHours = maxPendingHours;
  }

  start() {
    // Check immediately on start
    this.checkPendingPayments();

    // Then set up interval
    this.intervalId = setInterval(() => {
      this.checkPendingPayments();
    }, this.checkIntervalMinutes * 60 * 1000);

    console.log(`Payment checker started. Checking every ${this.checkIntervalMinutes} minutes.`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Payment checker stopped.');
    }
  }

  async checkPendingPayments() {
    try {
      console.log('Checking for pending payments...');

      // Get all pending payments
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - 10);

      const pendingPayments = await MpesaPayment.find({
        status: MpesaPaymentStatus.PENDING,
        createdAt: { $lt: cutoffTime }
      });

      console.log(`Found ${pendingPayments.length} pending payments older than 10 minutes.`);

      // Process each pending payment
      for (const payment of pendingPayments) {
        // Check if payment is too old (beyond max pending hours)
        const paymentAge = (new Date().getTime() - payment.createdAt.getTime()) / (1000 * 60 * 60);

        if (paymentAge > this.maxPendingHours) {
          console.log(`Payment ${payment._id} is too old (${paymentAge.toFixed(2)} hours). Marking as failed.`);
          payment.status = MpesaPaymentStatus.FAILED;
          payment.resultDesc = 'Timeout: Payment not completed in allowed time';
          await payment.save();
          continue;
        }

        // Check with M-Pesa for status
        try {
          console.log(`Checking status for payment ${payment._id} with CheckoutRequestID ${payment.checkoutRequestId}`);
          const stkStatusResponse = await this.mpesaService.querySTKStatus(payment.checkoutRequestId);

          const resultCode = stkStatusResponse.ResultCode;
          const resultDesc = stkStatusResponse.ResultDesc;

          console.log(`STK query for payment ${payment._id}: Code=${resultCode}, Desc=${resultDesc}`);

          // Update payment based on status
          if (resultCode === 0) {
            // Success - payment completed
            payment.status = MpesaPaymentStatus.COMPLETED;
            payment.resultCode = resultCode;
            payment.resultDesc = resultDesc;
            await payment.save();

            // Register the user for the event
            await this.eventService.registerAttendee(
              payment.eventId.toString(),
              payment.userId.toString()
            );

            console.log(`Payment ${payment._id} marked as completed and user registered.`);
          } else if (resultCode !== 1032) {
            // Failed transaction (1032 means request cancelled or still pending)
            payment.status = MpesaPaymentStatus.FAILED;
            payment.resultCode = resultCode;
            payment.resultDesc = resultDesc;
            await payment.save();

            console.log(`Payment ${payment._id} marked as failed.`);
          } else {
            console.log(`Payment ${payment._id} is still pending or was cancelled by user.`);
          }
        } catch (error) {
          console.error(`Error checking status for payment ${payment._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in checkPendingPayments:', error);
    }
  }
}

// Singleton instance to be used across the application
export const paymentChecker = new PaymentChecker();
