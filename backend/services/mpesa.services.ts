import { Types } from 'mongoose';
import { MpesaPayment, MpesaPaymentStatus, MpesaPaymentMethod } from '../models/mpesapayment.model';
import { MpesaService, MpesaCallbackDto } from './mpesaApi.service';
import { AppError } from '../utils/errors.utils';
import { EventService } from './event.service';

export interface InitiatePaymentDto {
  eventId: string;
  userId: string;
  phoneNumber: string;
  amount: number;
}

export class MPaymentService {
  private mpesaService: MpesaService;
  private eventService: EventService;

  constructor() {
    this.mpesaService = new MpesaService();
    this.eventService = new EventService();
  }

  async initiatePayment(paymentData: InitiatePaymentDto): Promise<any> {
    try {
      console.log('Initiating payment with data:', paymentData);
      // Validate payment data
      if (!paymentData.eventId || !paymentData.userId || !paymentData.phoneNumber || !paymentData.amount) {
        throw new AppError('Missing required payment data', 400);
      }
      // Check if event exists and has space
      const event = await this.eventService.getEventById(paymentData.eventId);

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      // Check if event has reached capacity
      if (event.capacity && event.attendees.length >= event.capacity) {
        throw new AppError('Event has reached maximum capacity', 400);
      }

        const isUserRegistered = event.attendees.some((attendee: Types.ObjectId | { _id: Types.ObjectId } | string) => {
          console.log('Checking attendee:', attendee);

          // Handle if attendee is already an ObjectId
          if (attendee instanceof Types.ObjectId) {
            const isMatch = attendee.toString() === paymentData.userId;
            console.log(`Attendee is ObjectId. Match: ${isMatch}`);
            return isMatch;
          }

          // Handle if attendee is a user object with _id
          if (typeof attendee === 'object' && '_id' in attendee && attendee._id instanceof Types.ObjectId) {
            const isMatch = attendee._id.toString() === paymentData.userId;
            console.log(`Attendee is user object with _id. Match: ${isMatch}`);
            return isMatch;
          }

          // Handle if it's a string representation of a user object (your case)
          if (typeof attendee === 'string') {
            const isMatch = attendee.includes(paymentData.userId);
            console.log(`Attendee is string. Match: ${isMatch}`);
            return isMatch;
          }

          console.log('Attendee type not recognized.');
          return false;
        });

        console.log('Is user registered:', isUserRegistered);

        if (isUserRegistered) {
          throw new AppError('User already registered for this event', 400);
        }

      // Validate event capacity constraints
      if (event.capacity) {
        if (event.capacity > 5000) {
          throw new AppError('Maximum event capacity is 5000', 400);
        }
        if (event.capacity < 30) {
          throw new AppError('Minimum event capacity is 30', 400);
        }
      }

      // Get the ticket price from the event
      const ticketPrice = event.ticketPrice || 0;

      // Verify the amount matches the ticket price
      if (ticketPrice !== paymentData.amount) {
        throw new AppError(`Payment amount doesn't match event ticket price. Expected: ${ticketPrice}`, 400);
      }

      // Generate a unique callbackUrl with event and user IDs
      const callbackUrl = `${process.env.APP_URL || 'https://final-year-project-3qr3.onrender.com'}/api/v1/mpesa/callback/${paymentData.eventId}/${paymentData.userId}`;

      // Initiate STK push
      const stkPushResponse = await this.mpesaService.initiateSTKPush({
        phoneNumber: paymentData.phoneNumber,
        amount: paymentData.amount,
        callbackUrl,
        accountReference: `Event#${paymentData.eventId}`,
        description: `Payment for ${event.title}`
      });

      // Create payment record in pending state
      const payment = new MpesaPayment({
        amount: paymentData.amount,
        paymentMethod: MpesaPaymentMethod.MPESA,
        status: MpesaPaymentStatus.PENDING,
        eventId: new Types.ObjectId(paymentData.eventId),
        userId: new Types.ObjectId(paymentData.userId),
        phoneNumber: paymentData.phoneNumber,
        merchantRequestId: stkPushResponse.MerchantRequestID,
        checkoutRequestId: stkPushResponse.CheckoutRequestID
      });

      await payment.save();

      return {
        paymentId: payment._id,
        merchantRequestId: payment.merchantRequestId,
        checkoutRequestId: payment.checkoutRequestId,
        status: payment.status
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to initiate payment', 500);
    }
  }

  async handlePaymentCallback(callbackData: MpesaCallbackDto, eventId: string, userId: string): Promise<any> {
    try {
      // Parse callback data
    const paymentResult = this.mpesaService.parseCallbackData(callbackData);

    // Log the values for debugging
    console.log(`Callback for eventId: ${eventId}, userId: ${userId}`);

    if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid eventId or userId format', 400);
    }

      // Find the payment record
      const payment = await MpesaPayment.findOne({
        merchantRequestId: callbackData.Body.stkCallback.MerchantRequestID,
        checkoutRequestId: callbackData.Body.stkCallback.CheckoutRequestID,
        eventId: new Types.ObjectId(eventId),
        userId: new Types.ObjectId(userId)
      });

      if (!payment) {
        throw new AppError('Payment record not found', 404);
      }

      // Update payment status
      payment.status = paymentResult.success ? MpesaPaymentStatus.COMPLETED : MpesaPaymentStatus.FAILED;
      payment.resultCode = paymentResult.resultCode;
      payment.resultDesc = paymentResult.resultDesc;

      if (paymentResult.success) {
        payment.transactionId = paymentResult.transactionId;
      }

      await payment.save();

      // If payment was successful, register the user for the event
      if (paymentResult.success) {
        await this.eventService.registerAttendee(eventId, userId);
      }

      console.log('Payment record updated:', payment);
      console.log('Payment result:', paymentResult);

      return {
        success: paymentResult.success,
        paymentId: payment._id,
        status: payment.status,
        message: paymentResult.resultDesc
      };
    } catch (error) {
       console.error('Error handling payment callback:', error);
       console.error('EventId:', eventId, 'UserId:', userId);
       console.error('MerchantRequestID:', callbackData.Body.stkCallback.MerchantRequestID);
       console.error('CheckoutRequestID:', callbackData.Body.stkCallback.CheckoutRequestID);

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to process payment callback', 500);
    }
  }

  async getPaymentByEventAndUser(eventId: string, userId: string): Promise<MpesaPayment | null> {
    try {
      return await MpesaPayment.findOne({
        eventId: new Types.ObjectId(eventId),
        userId: new Types.ObjectId(userId)
      });
    } catch (error) {
      throw new AppError('Failed to retrieve payment information', 500);
    }
  }
}
