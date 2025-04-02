import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { ResponseUtil } from '../utils/response.utils';
import { UserRole } from '../models/user.model';
import { ReportService } from '../services/reports.service';

export class ReportController {
  private eventService: EventService;
  private reportService: ReportService;

  constructor() {
    this.eventService = new EventService();
    this.reportService = new ReportService();
  }

  async generateEventAttendeesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id;

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;
      const userRole = (req.user as any).role;

      // Get the event to check ownership
      const event = await this.eventService.getEventById(eventId);

      if (!event) {
        return ResponseUtil.error(res, 404, 'Event not found');
      }

      // Check if user is the organizer or an admin
      if (event.organizer.toString() !== userId && userRole !== UserRole.ADMIN) {
        return ResponseUtil.error(res, 403, 'You do not have permission to access this report');
      }

      // Get attendee details and generate CSV
      const attendees = await EventService.getEventAttendees(eventId, userId);
      const csvData = ReportService.generateAttendeesCsv(attendees);

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="event-${eventId}-attendees.csv"`);

      return res.send(csvData);
    } catch (error) {
      next(error);
    }
  }

  async generateEventsSummaryReport(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;
      const userRole = (req.user as any).role;

      // Only organizers and admins can access this endpoint
      if (userRole !== UserRole.ORGANIZER && userRole !== UserRole.ADMIN) {
        return ResponseUtil.error(res, 403, 'Insufficient permissions');
      }

      // Get all events organized by the user
      const events = await EventService.getEventsByOrganizer(userId);

      // Generate CSV
      const csvData = ReportService.generateEventsSummaryCsv(events);

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="events-summary.csv"`);

      return res.send(csvData);
    } catch (error) {
      next(error);
    }
  }

  async generateEventAnalyticsReport(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id;

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;
      const userRole = (req.user as any).role;

      // Get the event to check ownership
      const event = await this.eventService.getEventById(eventId);

      if (!event) {
        return ResponseUtil.error(res, 404, 'Event not found');
      }

      // Check if user is the organizer or an admin
      if (event.organizer.toString() !== userId && userRole !== UserRole.ADMIN) {
        return ResponseUtil.error(res, 403, 'You do not have permission to access this report');
      }

      // Generate analytics report
      const reportData = await ReportService.generateEventAnalytics(eventId);

      return ResponseUtil.success(res, 200, reportData, 'Event analytics generated successfully');
    } catch (error) {
      next(error);
    }
  }
}
