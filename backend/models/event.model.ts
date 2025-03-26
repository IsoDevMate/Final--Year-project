import mongoose, { Document, Schema } from 'mongoose';

export enum EventType {
  CONFERENCE = 'conference',
  SEMINAR = 'seminar',
  WORKSHOP = 'workshop',
  EXPO = 'expo',
  OTHER = 'other'
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Event extends Document {
  title: string;
  description: string;
  organizer: mongoose.Types.ObjectId;
  type: EventType;
  status: EventStatus;
  startDate: Date;
  endDate: Date;
  location: {
    name: string;
    address: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  capacity?: number;
  ticketPrice?: number;
  coverImage?: string;
  sessions: mongoose.Types.ObjectId[];
  attendees: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<Event>(
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
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: Object.values(EventType),
      default: EventType.CONFERENCE
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.DRAFT
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    location: {
      name: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true
      },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    capacity: {
      type: Number
    },
    ticketPrice: {
      type: Number,
      default: 0
    },
    coverImage: {
      type: String
    },
    sessions: [{
      type: Schema.Types.ObjectId,
      ref: 'Session'
    }],
    attendees: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

// Index for efficient searches
eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ startDate: 1 });
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ status: 1 });

export const Event = mongoose.model<Event>('Event', eventSchema);
