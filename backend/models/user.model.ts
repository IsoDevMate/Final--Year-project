import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  ATTENDEE = 'attendee',
  ORGANIZER = 'organizer',
  ADMIN = 'admin'
}

export interface User extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImage?: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
  };
  createdAt: Date;
  updatedAt: Date;
 // comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.ATTENDEE
    },
    profileImage: {
      type: String
    },
    bio: {
      type: String
    },
    socialLinks: {
      linkedinId: {
        type: String,
        unique: true,
        sparse: true
      },
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<User>('User', userSchema);

