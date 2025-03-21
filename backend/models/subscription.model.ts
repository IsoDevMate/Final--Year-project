import mongoose, { Document, Schema } from 'mongoose';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELED = 'canceled',
  EXPIRED = 'expired'
}

export enum SubscriptionPlan {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export interface Subscription extends Document {
  userId: mongoose.Types.ObjectId;
  planType: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  stripeSubscriptionId?: string;
  price: number;
  currency: string;
  paymentId: mongoose.Types.ObjectId;
  features: {
    canLivestream: boolean;
    maxDuration: number;
    maxViewers: number;
    analyticsAccess: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<Subscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    planType: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.INACTIVE
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    stripeSubscriptionId: {
      type: String
    },
    price: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'usd',
      required: true
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true
    },
    features: {
      canLivestream: {
        type: Boolean,
        default: true
      },
      maxDuration: {
        type: Number,
        default: 60 // in minutes
      },
      maxViewers: {
        type: Number,
        default: 100
      },
      analyticsAccess: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

export const Subscription = mongoose.model<Subscription>('Subscription', subscriptionSchema);
