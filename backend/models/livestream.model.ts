import mongoose, { Document, Schema } from 'mongoose';

export enum StreamStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

export interface Livestream extends Document {
  title: string;
  description: string;
  sessionId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  streamerId: mongoose.Types.ObjectId;
  status: StreamStatus;
  scheduledStartTime: Date;
  actualStartTime?: Date;
  endTime?: Date;
  viewerCount: number;
  thumbnailUrl?: string;
  roomId: string;
  createdAt: Date;
  updatedAt: Date;
}

const livestreamSchema = new Schema<Livestream>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    streamerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: Object.values(StreamStatus),
      default: StreamStatus.SCHEDULED
    },
    scheduledStartTime: {
      type: Date,
      required: true
    },
    actualStartTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    viewerCount: {
      type: Number,
      default: 0
    },
    thumbnailUrl: {
      type: String
    },
    roomId: {
      type: String,
      required: true,
      unique: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
livestreamSchema.index({ eventId: 1 });
livestreamSchema.index({ sessionId: 1 });
livestreamSchema.index({ streamerId: 1 });
livestreamSchema.index({ status: 1 });
livestreamSchema.index({ scheduledStartTime: 1 });

export const Livestream = mongoose.model<Livestream>('Livestream', livestreamSchema);
