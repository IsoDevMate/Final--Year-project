"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const report_controllers_1 = require("../controllers/report.controllers");
const auth_mddleware_1 = require("../middleware/auth.mddleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
const reportController = new report_controllers_1.ReportController();
// Routes for report generation
// Generate a summary report of all events for the authenticated user
router.get('/events/summary', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), reportController.generateEventsSummaryReport);
router.get('/events/:id/attendees', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), reportController.generateEventAttendeesReport);
router.get('/events/:id/analytics', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), reportController.generateEventAnalyticsReport);
// Export the router
exports.default = router;
