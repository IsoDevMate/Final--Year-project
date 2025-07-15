"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const event_service_1 = require("../services/event.service");
const response_utils_1 = require("../utils/response.utils");
const user_model_1 = require("../models/user.model");
const reports_service_1 = require("../services/reports.service");
class ReportController {
    constructor() {
        this.eventService = new event_service_1.EventService();
        this.reportService = new reports_service_1.ReportService();
    }
    generateEventAttendeesReport(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const eventId = req.params.id;
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const userRole = req.user.role;
                // Get the event to check ownership
                const event = yield this.eventService.getEventById(eventId);
                if (!event) {
                    return response_utils_1.ResponseUtil.error(res, 404, 'Event not found');
                }
                // Check if user is the organizer or an admin
                if (event.organizer.toString() !== userId && userRole !== user_model_1.UserRole.ADMIN) {
                    return response_utils_1.ResponseUtil.error(res, 403, 'You do not have permission to access this report');
                }
                // Get attendee details and generate CSV
                const attendees = yield event_service_1.EventService.getEventAttendees(eventId, userId);
                const csvData = reports_service_1.ReportService.generateAttendeesCsv(attendees);
                // Set headers for CSV download
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="event-${eventId}-attendees.csv"`);
                return res.send(csvData);
            }
            catch (error) {
                next(error);
            }
        });
    }
    generateEventsSummaryReport(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const userRole = req.user.role;
                // Only organizers and admins can access this endpoint
                if (userRole !== user_model_1.UserRole.ORGANIZER && userRole !== user_model_1.UserRole.ADMIN) {
                    return response_utils_1.ResponseUtil.error(res, 403, 'Insufficient permissions');
                }
                // Get all events organized by the user
                const events = yield event_service_1.EventService.getEventsByOrganizer(userId);
                // Generate CSV
                const csvData = reports_service_1.ReportService.generateEventsSummaryCsv(events);
                // Set headers for CSV download
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="events-summary.csv"`);
                return res.send(csvData);
            }
            catch (error) {
                next(error);
            }
        });
    }
    generateEventAnalyticsReport(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const eventId = req.params.id;
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const userRole = req.user.role;
                // Get the event to check ownership
                const event = yield this.eventService.getEventById(eventId);
                if (!event) {
                    return response_utils_1.ResponseUtil.error(res, 404, 'Event not found');
                }
                // Check if user is the organizer or an admin
                if (event.organizer.toString() !== userId && userRole !== user_model_1.UserRole.ADMIN) {
                    return response_utils_1.ResponseUtil.error(res, 403, 'You do not have permission to access this report');
                }
                // Generate analytics report
                const reportData = yield reports_service_1.ReportService.generateEventAnalytics(eventId);
                return response_utils_1.ResponseUtil.success(res, 200, reportData, 'Event analytics generated successfully');
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.ReportController = ReportController;
