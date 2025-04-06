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
  };
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

