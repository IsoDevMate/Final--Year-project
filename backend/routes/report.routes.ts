import express from 'express';
import { ReportController } from '../controllers/report.controllers';
import { AuthMiddleware } from '../middleware/auth.mddleware';
import { UserRole, User } from '../models/user.model';
import { Event } from '../models/event.model';

const router = express.Router();
const reportController = new ReportController();

// Existing CSV routes
router.get('/events/summary', AuthMiddleware.verifyToken, AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]), reportController.generateEventsSummaryReport.bind(reportController));
router.get('/events/:id/attendees', AuthMiddleware.verifyToken, AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]), reportController.generateEventAttendeesReport.bind(reportController));
router.get('/events/:id/analytics', AuthMiddleware.verifyToken, AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]), reportController.generateEventAnalyticsReport.bind(reportController));

// PDF report by period: daily | weekly | monthly
router.get('/pdf/:period', AuthMiddleware.verifyToken, AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]), async (req, res, next) => {
  try {
    const { period } = req.params; // daily | weekly | monthly
    const userId = (req.user as any).userId;
    const userRole = (req.user as any).role;

    const now = new Date();
    let startDate: Date;
    if (period === 'daily') {
      startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      startDate = new Date(now); startDate.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
      startDate = new Date(now); startDate.setMonth(now.getMonth() - 1);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid period. Use daily, weekly, or monthly.' });
    }

    const query: any = { createdAt: { $gte: startDate, $lte: now } };
    if (userRole !== UserRole.ADMIN) query.organizer = userId;

    const events = await Event.find(query).populate('organizer', 'firstName lastName email').lean();

    // Build HTML for PDF
    const rows = events.map((e: any) => `
      <tr>
        <td>${e.title}</td>
        <td>${e.organizer?.firstName || ''} ${e.organizer?.lastName || ''}</td>
        <td>${new Date(e.startDate).toLocaleDateString()}</td>
        <td>${e.status}</td>
        <td>${e.type}</td>
        <td>${e.attendees?.length ?? 0}</td>
        <td>${e.ticketPrice ? `KES ${e.ticketPrice}` : 'Free'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
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
  .summary { display: flex; gap: 24px; margin-bottom: 24px; }
  .card { background: #f0fdfc; border: 1px solid #0ABAB5; border-radius: 8px; padding: 16px 24px; }
  .card h3 { margin: 0 0 4px; font-size: 13px; color: #555; }
  .card p { margin: 0; font-size: 24px; font-weight: bold; color: #0ABAB5; }
</style>
</head>
<body>
<h1>eventbase — ${period.charAt(0).toUpperCase() + period.slice(1)} Report</h1>
<p class="meta">Generated: ${now.toLocaleString()} &nbsp;|&nbsp; Period: ${startDate.toLocaleDateString()} – ${now.toLocaleDateString()}</p>
<div class="summary">
  <div class="card"><h3>Total Events</h3><p>${events.length}</p></div>
  <div class="card"><h3>Total Attendees</h3><p>${events.reduce((s: number, e: any) => s + (e.attendees?.length ?? 0), 0)}</p></div>
  <div class="card"><h3>Revenue (KES)</h3><p>${events.reduce((s: number, e: any) => s + ((e.ticketPrice ?? 0) * (e.attendees?.length ?? 0)), 0).toLocaleString()}</p></div>
</div>
<table>
  <thead><tr><th>Event</th><th>Organizer</th><th>Date</th><th>Status</th><th>Type</th><th>Attendees</th><th>Price</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#999">No events in this period</td></tr>'}</tbody>
</table>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="report-${period}-${now.toISOString().split('T')[0]}.html"`);
    return res.send(html);
  } catch (e) { next(e); }
});

export default router;
