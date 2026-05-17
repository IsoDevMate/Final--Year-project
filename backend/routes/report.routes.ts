import express from 'express';
import { ReportController } from '../controllers/report.controllers';
import { AuthMiddleware } from '../middleware/auth.mddleware';
import { UserRole } from '../models/user.model';
import { Event } from '../models/event.model';
import { MpesaPayment } from '../models/mpesapayment.model';

const router = express.Router();
const reportController = new ReportController();

// Legacy CSV routes (kept for backward compat)
router.get('/events/summary', AuthMiddleware.verifyToken, AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]), reportController.generateEventsSummaryReport.bind(reportController));
router.get('/events/:id/attendees', AuthMiddleware.verifyToken, AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]), reportController.generateEventAttendeesReport.bind(reportController));
router.get('/events/:id/analytics', AuthMiddleware.verifyToken, AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]), reportController.generateEventAnalyticsReport.bind(reportController));

// Events PDF report by period: daily | weekly | monthly
router.get('/pdf/:period', AuthMiddleware.verifyToken, AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]), async (req, res, next) => {
  try {
    const { period } = req.params;
    const userId = (req.user as any).userId;
    const userRole = (req.user as any).role;
    const now = new Date();
    const startDate = getPeriodStart(period, now);
    if (!startDate) return res.status(400).json({ success: false, message: 'Invalid period. Use daily, weekly, or monthly.' });

    const query: any = { createdAt: { $gte: startDate, $lte: now } };
    if (userRole !== UserRole.ADMIN) query.organizer = userId;

    const events = await Event.find(query).populate('organizer', 'firstName lastName email').lean();

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

    const html = buildReportHtml(
      `eventbase — ${cap(period)} Events Report`,
      `${startDate.toLocaleDateString()} – ${now.toLocaleDateString()}`,
      now,
      [
        { label: 'Total Events', value: events.length },
        { label: 'Total Attendees', value: events.reduce((s: number, e: any) => s + (e.attendees?.length ?? 0), 0) },
        { label: 'Revenue (KES)', value: events.reduce((s: number, e: any) => s + ((e.ticketPrice ?? 0) * (e.attendees?.length ?? 0)), 0).toLocaleString() },
      ],
      '<thead><tr><th>Event</th><th>Organizer</th><th>Date</th><th>Status</th><th>Type</th><th>Attendees</th><th>Price</th></tr></thead>',
      rows || '<tr><td colspan="7" style="text-align:center;color:#999">No events in this period</td></tr>'
    );

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="events-report-${period}-${now.toISOString().split('T')[0]}.html"`);
    return res.send(html);
  } catch (e) { next(e); }
});

// M-Pesa PDF report by period
router.get('/mpesa/:period', AuthMiddleware.verifyToken, AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]), async (req, res, next) => {
  try {
    const { period } = req.params;
    const userId = (req.user as any).userId;
    const userRole = (req.user as any).role;
    const now = new Date();
    const startDate = getPeriodStart(period, now);
    if (!startDate) return res.status(400).json({ success: false, message: 'Invalid period. Use daily, weekly, or monthly.' });

    const query: any = { createdAt: { $gte: startDate, $lte: now } };
    if (userRole !== UserRole.ADMIN) {
      // For organizers: show payments for events they own
      const { Event } = await import('../models/event.model');
      const organizerEvents = await Event.find({ organizer: userId }).select('_id').lean();
      const eventIds = organizerEvents.map((e: any) => e._id);
      query.eventId = { $in: eventIds };
    }

    const payments = await MpesaPayment.find(query)
      .populate('eventId', 'title')
      .populate('userId', 'firstName lastName email')
      .lean();

    const totalAmount = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
    const completed = payments.filter(p => p.status === 'completed').length;
    const failed = payments.filter(p => p.status === 'failed').length;

    const rows = payments.map((p: any) => `
      <tr>
        <td>${p.transactionId || p.checkoutRequestId || 'N/A'}</td>
        <td>${p.userId?.firstName || ''} ${p.userId?.lastName || ''}</td>
        <td>${p.userId?.email || ''}</td>
        <td>${p.eventId?.title || 'N/A'}</td>
        <td>${p.phoneNumber}</td>
        <td>KES ${p.amount?.toLocaleString()}</td>
        <td><span style="color:${p.status === 'completed' ? '#16a34a' : p.status === 'failed' ? '#dc2626' : '#d97706'}">${p.status}</span></td>
        <td>${new Date(p.createdAt).toLocaleString()}</td>
      </tr>`).join('');

    const html = buildReportHtml(
      `eventbase — ${cap(period)} M-Pesa Payments Report`,
      `${startDate.toLocaleDateString()} – ${now.toLocaleDateString()}`,
      now,
      [
        { label: 'Total Transactions', value: payments.length },
        { label: 'Completed', value: completed },
        { label: 'Failed', value: failed },
        { label: 'Total Amount (KES)', value: `KES ${totalAmount.toLocaleString()}` },
      ],
      '<thead><tr><th>Transaction ID</th><th>Name</th><th>Email</th><th>Event</th><th>Phone</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>',
      rows || '<tr><td colspan="8" style="text-align:center;color:#999">No M-Pesa payments in this period</td></tr>'
    );

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="mpesa-report-${period}-${now.toISOString().split('T')[0]}.html"`);
    return res.send(html);
  } catch (e) { next(e); }
});

function getPeriodStart(period: string, now: Date): Date | null {
  const d = new Date(now);
  if (period === 'daily') { d.setHours(0, 0, 0, 0); return d; }
  if (period === 'weekly') { d.setDate(d.getDate() - 7); return d; }
  if (period === 'monthly') { d.setMonth(d.getMonth() - 1); return d; }
  return null;
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function buildReportHtml(
  title: string,
  period: string,
  now: Date,
  cards: { label: string; value: string | number }[],
  thead: string,
  tbody: string
): string {
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

export default router;
