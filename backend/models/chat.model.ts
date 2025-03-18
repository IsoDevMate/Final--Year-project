import mongoose, { Document, Schema } from 'mongoose';

export interface ChatMessage extends Document {
  livestreamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  message: string;
  timestamp: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<ChatMessage>(
  {
    livestreamId: {
      type: Schema.Types.ObjectId,
      ref: 'Livestream',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
chatMessageSchema.index({ livestreamId: 1, timestamp: 1 });
chatMessageSchema.index({ userId: 1 });

export const ChatMessage = mongoose.model<ChatMessage>('ChatMessage', chatMessageSchema);
