import mongoose, { Document, Schema } from 'mongoose';

export interface MediaAttachment {
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  caption?: string;
  createdAt: Date;
}

export interface Note extends Document {
  title: string;
  content: string;
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  session?: mongoose.Types.ObjectId;
  mediaAttachments?: MediaAttachment[];
  tags?: string[];
  isPrivate: boolean;
  sharedWith?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<Note>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'Session'
    },
    mediaAttachments: [{
      type: {
        type: String,
        enum: ['image', 'audio', 'video', 'document'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      caption: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    tags: [{
      type: String
    }],
    isPrivate: {
      type: Boolean,
      default: true
    },
    sharedWith: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
noteSchema.index({ user: 1, event: 1 });
noteSchema.index({ session: 1 });
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

export const Note = mongoose.model<Note>('Note', noteSchema);
