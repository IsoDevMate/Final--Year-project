import { Event } from '../models/event.model';
import { createObjectCsvStringifier } from 'csv-writer';

export class ReportService {
  static generateAttendeesCsv(attendees: any[]): string {
    // Define CSV header
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'registrationDate', title: 'Registration Date' }
      ]
    });

    // Format data for CSV
    const records = attendees.map(attendee => ({
      name: `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim(),
      email: attendee.email || '',
      phone: attendee.phone || 'N/A',
      registrationDate: attendee.registrationDate ? new Date(attendee.registrationDate).toISOString() : 'N/A'
    }));

    // Generate CSV
    const csvHeader = csvStringifier.getHeaderString();
    const csvRecords = csvStringifier.stringifyRecords(records);

    return csvHeader + csvRecords;
  }

  static generateEventsSummaryCsv(events: Event[]): string {
    // Define CSV header
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'title', title: 'Event Title' },
        { id: 'startDate', title: 'Start Date' },
        { id: 'endDate', title: 'End Date' },
        { id: 'location', title: 'Location' },
        { id: 'type', title: 'Type' },
        { id: 'status', title: 'Status' },
        { id: 'attendeeCount', title: 'Attendee Count' },
        { id: 'capacity', title: 'Capacity' },
        { id: 'ticketPrice', title: 'Ticket Price' }
      ]
    });

    // Format data for CSV
    const records = events.map(event => ({
      title: event.title,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      location: `${event.location.name}, ${event.location.city}`,
      type: event.type,
      status: event.status,
      attendeeCount: event.attendees.length,
      capacity: event.capacity || 'Unlimited',
      ticketPrice: event.ticketPrice ? `${event.ticketPrice}` : 'Free'
    }));

    // Generate CSV
    const csvHeader = csvStringifier.getHeaderString();
    const csvRecords = csvStringifier.stringifyRecords(records);

    return csvHeader + csvRecords;
  }

 static async generateEventAnalytics(eventId: string): Promise<any> {
    // Get event with all attendees
    const event = await Event.findById(eventId)
      .populate('attendees')
      .populate('sessions');

    if (!event) {
      throw new Error('Event not found');
    }

    // Calculate registration timeline
    const registrationTimeline = {}; // To be populated with registration date counts

    // For demo purposes, generate some dummy analytics
    return {
      overview: {
        totalAttendees: event.attendees.length,
        capacity: event.capacity || 'Unlimited',
        registrationRate: event.capacity ? (event.attendees.length / event.capacity * 100).toFixed(2) + '%' : 'N/A',
        eventType: event.type,
        status: event.status
      },
      sessions: {
        count: event.sessions.length,
        // Other session analytics
      },
      // Future implementation: More detailed analytics including:
      // - Registration timeline
      // - Demographic breakdown
      // - Revenue analysis if applicable
    };
  }
}
