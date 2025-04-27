interface IUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'organizer' | 'attendee';
  phoneNumber?: string;
  bio?: string;
  profileImage?: string;
  socialLinks?: {
    linkedinId?: string;
    linkedinAccessToken?: string;
    linkedinRefreshToken?: string;
    linkedinTokenExpiry?: Date;
  };
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

