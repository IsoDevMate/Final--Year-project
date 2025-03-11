interface IUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'organizer' | 'attendee';
  createdAt: Date;
  updatedAt: Date;
}

