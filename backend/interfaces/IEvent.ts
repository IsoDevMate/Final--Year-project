interface IEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  organizer: string; // references User ID
  sessions: string[]; // array of session IDs
  attendees: string[]; // array of user IDs
  createdAt: Date;
  updatedAt: Date;
}
