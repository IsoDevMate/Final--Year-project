import mongoose, { Document, Schema } from 'mongoose';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Session extends Document {
  title: string;
  description: string;
  event: mongoose.Types.ObjectId;
  speaker: {
    name: string;
    bio?: string;
    profileImage?: string;
    organization?: string;
    position?: string;
    userId?: mongoose.Types.ObjectId;
  };
  startTime: Date;
  endTime: Date;
  location: string;
  capacity?: number;
  status: SessionStatus;
  tags?: string[];
  materials?: string[];
  isLiveStreamed: boolean;
  streamUrl?: string;
  attendees: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<Session>(
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
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    speaker: {
      name: {
        type: String,
        required: true
      },
      bio: String,
      profileImage: String,
      organization: String,
      position: String,
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    capacity: {
      type: Number
    },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.SCHEDULED
    },
    tags: [{
      type: String
    }],
    materials: [{
      type: String
    }],
    isLiveStreamed: {
      type: Boolean,
      default: false
    },
    streamUrl: {
      type: String
    },
    attendees: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
sessionSchema.index({ startTime: 1 });
sessionSchema.index({ event: 1 });
sessionSchema.index({ title: 'text', description: 'text' });

export const Session = mongoose.model<Session>('Session', sessionSchema);
