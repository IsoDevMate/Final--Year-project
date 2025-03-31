import mongoose, { Document, Schema } from 'mongoose';

export enum MpesaPaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum MpesaPaymentMethod {
  MPESA = 'mpesa',
}

export interface MpesaPayment extends Document {
  amount: number;
  currency: string;
  paymentMethod: MpesaPaymentMethod;
  status: MpesaPaymentStatus;
  transactionId?: string;
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  phoneNumber: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  resultCode?: number;
  resultDesc?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MpesapaymentSchema = new Schema<MpesaPayment>(
  {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'KES'
    },
    paymentMethod: {
      type: String,
      enum: Object.values(MpesaPaymentMethod),
      default: MpesaPaymentMethod.MPESA
    },
    status: {
      type: String,
      enum: Object.values(MpesaPaymentStatus),
      default: MpesaPaymentStatus.PENDING
    },
    transactionId: {
      type: String
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    merchantRequestId: {
      type: String
    },
    checkoutRequestId: {
      type: String
    },
    resultCode: {
      type: Number
    },
    resultDesc: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient searches
MpesapaymentSchema.index({ eventId: 1, userId: 1 });
MpesapaymentSchema.index({ transactionId: 1 });
MpesapaymentSchema.index({ merchantRequestId: 1 });
MpesapaymentSchema.index({ checkoutRequestId: 1 });

export const MpesaPayment = mongoose.model<MpesaPayment>('MpesaPayment', MpesapaymentSchema);
