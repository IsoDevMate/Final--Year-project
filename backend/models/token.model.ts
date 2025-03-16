import mongoose, { Document, Schema } from 'mongoose';

export interface Token extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const tokenSchema = new Schema<Token>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index to automatically expire tokens
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Token = mongoose.model<Token>('Token', tokenSchema);
