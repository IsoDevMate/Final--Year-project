"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const report_controllers_1 = require("../controllers/report.controllers");
const auth_mddleware_1 = require("../middleware/auth.mddleware");
const user_model_1 = require("../models/user.model");
const event_model_1 = require("../models/event.model");
const mpesapayment_model_1 = require("../models/mpesapayment.model");
const router = express_1.default.Router();
const reportController = new report_controllers_1.ReportController();
// Legacy CSV routes (kept for backward compat)
router.get('/events/summary', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), reportController.generateEventsSummaryReport.bind(reportController));
router.get('/events/:id/attendees', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), reportController.generateEventAttendeesReport.bind(reportController));
router.get('/events/:id/analytics', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), reportController.generateEventAnalyticsReport.bind(reportController));
// Events PDF report by period: daily | weekly | monthly
router.get('/pdf/:period', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { period } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const now = new Date();
        const startDate = getPeriodStart(period, now);
        if (!startDate)
            return res.status(400).json({ success: false, message: 'Invalid period. Use daily, weekly, or monthly.' });
        const query = { createdAt: { $gte: startDate, $lte: now } };
        if (userRole !== user_model_1.UserRole.ADMIN)
            query.organizer = userId;
        const events = yield event_model_1.Event.find(query).populate('organizer', 'firstName lastName email').lean();
        const rows = events.map((e) => {
            var _a, _b, _c, _d;
            return `
      <tr>
        <td>${e.title}</td>
        <td>${((_a = e.organizer) === null || _a === void 0 ? void 0 : _a.firstName) || ''} ${((_b = e.organizer) === null || _b === void 0 ? void 0 : _b.lastName) || ''}</td>
        <td>${new Date(e.startDate).toLocaleDateString()}</td>
        <td>${e.status}</td>
        <td>${e.type}</td>
        <td>${(_d = (_c = e.attendees) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0}</td>
        <td>${e.ticketPrice ? `KES ${e.ticketPrice}` : 'Free'}</td>
      </tr>`;
        }).join('');
        const html = buildReportHtml(`eventbase — ${cap(period)} Events Report`, `${startDate.toLocaleDateString()} – ${now.toLocaleDateString()}`, now, [
            { label: 'Total Events', value: events.length },
            { label: 'Total Attendees', value: events.reduce((s, e) => { var _a, _b; return s + ((_b = (_a = e.attendees) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0); }, 0) },
            { label: 'Revenue (KES)', value: events.reduce((s, e) => { var _a, _b, _c; return s + (((_a = e.ticketPrice) !== null && _a !== void 0 ? _a : 0) * ((_c = (_b = e.attendees) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0)); }, 0).toLocaleString() },
        ], '<thead><tr><th>Event</th><th>Organizer</th><th>Date</th><th>Status</th><th>Type</th><th>Attendees</th><th>Price</th></tr></thead>', rows || '<tr><td colspan="7" style="text-align:center;color:#999">No events in this period</td></tr>');
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="events-report-${period}-${now.toISOString().split('T')[0]}.html"`);
        return res.send(html);
    }
    catch (e) {
        next(e);
    }
}));
// M-Pesa PDF report by period
router.get('/mpesa/:period', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { period } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const now = new Date();
        const startDate = getPeriodStart(period, now);
        if (!startDate)
            return res.status(400).json({ success: false, message: 'Invalid period. Use daily, weekly, or monthly.' });
        const query = { createdAt: { $gte: startDate, $lte: now } };
        if (userRole !== user_model_1.UserRole.ADMIN) {
            // For organizers: show payments for events they own
            const { Event } = yield Promise.resolve().then(() => __importStar(require('../models/event.model')));
            const organizerEvents = yield Event.find({ organizer: userId }).select('_id').lean();
            const eventIds = organizerEvents.map((e) => e._id);
            query.eventId = { $in: eventIds };
        }
        const payments = yield mpesapayment_model_1.MpesaPayment.find(query)
            .populate('eventId', 'title')
            .populate('userId', 'firstName lastName email')
            .lean();
        const totalAmount = payments.reduce((s, p) => { var _a; return s + ((_a = p.amount) !== null && _a !== void 0 ? _a : 0); }, 0);
        const completed = payments.filter(p => p.status === 'completed').length;
        const failed = payments.filter(p => p.status === 'failed').length;
        const rows = payments.map((p) => {
            var _a, _b, _c, _d, _e;
            return `
      <tr>
        <td>${p.transactionId || p.checkoutRequestId || 'N/A'}</td>
        <td>${((_a = p.userId) === null || _a === void 0 ? void 0 : _a.firstName) || ''} ${((_b = p.userId) === null || _b === void 0 ? void 0 : _b.lastName) || ''}</td>
        <td>${((_c = p.userId) === null || _c === void 0 ? void 0 : _c.email) || ''}</td>
        <td>${((_d = p.eventId) === null || _d === void 0 ? void 0 : _d.title) || 'N/A'}</td>
        <td>${p.phoneNumber}</td>
        <td>KES ${(_e = p.amount) === null || _e === void 0 ? void 0 : _e.toLocaleString()}</td>
        <td><span style="color:${p.status === 'completed' ? '#16a34a' : p.status === 'failed' ? '#dc2626' : '#d97706'}">${p.status}</span></td>
        <td>${new Date(p.createdAt).toLocaleString()}</td>
      </tr>`;
        }).join('');
        const html = buildReportHtml(`eventbase — ${cap(period)} M-Pesa Payments Report`, `${startDate.toLocaleDateString()} – ${now.toLocaleDateString()}`, now, [
            { label: 'Total Transactions', value: payments.length },
            { label: 'Completed', value: completed },
            { label: 'Failed', value: failed },
            { label: 'Total Amount (KES)', value: `KES ${totalAmount.toLocaleString()}` },
        ], '<thead><tr><th>Transaction ID</th><th>Name</th><th>Email</th><th>Event</th><th>Phone</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>', rows || '<tr><td colspan="8" style="text-align:center;color:#999">No M-Pesa payments in this period</td></tr>');
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="mpesa-report-${period}-${now.toISOString().split('T')[0]}.html"`);
        return res.send(html);
    }
    catch (e) {
        next(e);
    }
}));
function getPeriodStart(period, now) {
    const d = new Date(now);
    if (period === 'daily') {
        d.setHours(0, 0, 0, 0);
        return d;
    }
    if (period === 'weekly') {
        d.setDate(d.getDate() - 7);
        return d;
    }
    if (period === 'monthly') {
        d.setMonth(d.getMonth() - 1);
        return d;
    }
    return null;
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function buildReportHtml(title, period, now, cards, thead, tbody) {
    const cardHtml = cards.map(c => `<div class="card"><h3>${c.label}</h3><p>${c.value}</p></div>`).join('');
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
  h1 { color: #0ABAB5; }
  .meta { color: #555; font-size: 13px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #0ABAB5; color: white; padding: 8px 12px; text-align: left; }
  td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f0fdfc; }
  .summary { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
  .card { background: #f0fdfc; border: 1px solid #0ABAB5; border-radius: 8px; padding: 16px 24px; }
  .card h3 { margin: 0 0 4px; font-size: 13px; color: #555; }
  .card p { margin: 0; font-size: 24px; font-weight: bold; color: #0ABAB5; }
  @media print { button { display: none; } }
</style>
</head>
<body>
<h1>${title}</h1>
<p class="meta">Generated: ${now.toLocaleString()} &nbsp;|&nbsp; Period: ${period}</p>
<div class="summary">${cardHtml}</div>
<table>${thead}<tbody>${tbody}</tbody></table>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}
exports.default = router;
