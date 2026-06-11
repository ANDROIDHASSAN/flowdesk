import { Router } from 'express';
import { requireServiceToken } from '../middleware/auth';
import { Business } from '../models/Business';
import { DailyLog } from '../models/DailyLog';
import { FollowUp } from '../models/FollowUp';
import { Membership } from '../models/Membership';
import { Notification } from '../models/Notification';
import { Task } from '../models/Task';
import { TimeEntry } from '../models/TimeEntry';
import { emailShell, sendEmail } from '../services/email';
import { JOBS } from '../services/jobs';
import { istDayEnd, istDayStart, istToday } from '../utils/dates';
import { asyncHandler, badRequest, notFound } from '../utils/errors';

/**
 * Endpoints for the n8n automation layer. All protected by the `x-service-token`
 * header (SERVICE_TOKEN env var) — never exposed to browsers.
 *
 * Two styles, so schedules can live entirely in n8n:
 *  - READ endpoints   → n8n fetches data, composes messages itself, then POSTs /notify
 *  - ACTION endpoints → /mark-overdue mutates state; /run/:job runs a whole built-in job
 */
const router = Router();
router.use(requireServiceToken);

/** Follow-ups due today (IST), grouped per member with contact email */
router.get(
  '/due-followups',
  asyncHandler(async (_req, res) => {
    const today = istToday();
    const due = await FollowUp.find({
      status: 'PENDING',
      dueAt: { $gte: istDayStart(today), $lt: istDayEnd(today) },
    })
      .populate('userId', 'name email')
      .populate('businessId', 'name')
      .sort({ dueAt: 1 })
      .lean();
    res.json({ date: today, count: due.length, followups: due });
  })
);

/** Members who have logged neither a TimeEntry nor a DailyLog today */
router.get(
  '/missing-logs',
  asyncHandler(async (_req, res) => {
    const today = istToday();
    const memberships = await Membership.find({})
      .populate('userId', 'name email')
      .populate('businessId', 'name')
      .lean();
    const [timeUserIds, logUserIds] = await Promise.all([
      TimeEntry.distinct('userId', { date: today }),
      DailyLog.distinct('userId', { date: today }),
    ]);
    const logged = new Set([...timeUserIds, ...logUserIds].map(String));
    const seen = new Set<string>();
    const missing = memberships.filter((m) => {
      const u = m.userId as unknown as { _id: unknown } | null;
      if (!u) return false;
      const id = String(u._id);
      if (logged.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    res.json({ date: today, count: missing.length, members: missing });
  })
);

/** Tasks past due, not DONE, not yet alerted */
router.get(
  '/overdue-tasks',
  asyncHandler(async (_req, res) => {
    const tasks = await Task.find({
      status: { $ne: 'DONE' },
      dueAt: { $lt: new Date() },
      overdueNotifiedAt: null,
    })
      .populate('assigneeId', 'name email')
      .populate('businessId', 'name ownerId')
      .sort({ dueAt: 1 })
      .lean();
    res.json({ count: tasks.length, tasks });
  })
);

/** Flip PENDING follow-ups past dueAt to OVERDUE; returns what changed (with owner info for escalation) */
router.post(
  '/mark-overdue',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const overdue = await FollowUp.find({ status: 'PENDING', dueAt: { $lt: now } })
      .populate('userId', 'name email')
      .populate('businessId', 'name ownerId')
      .lean();
    if (overdue.length) {
      await FollowUp.updateMany(
        { _id: { $in: overdue.map((f) => f._id) } },
        { $set: { status: 'OVERDUE' } }
      );
    }
    // attach owner contact so n8n can escalate without extra queries
    const ownerIds = [...new Set(overdue.map((f) => String((f.businessId as { ownerId?: unknown })?.ownerId)))];
    const { User } = await import('../models/User');
    const owners = await User.find({ _id: { $in: ownerIds } }, 'name email').lean();
    const ownerMap = new Map(owners.map((o) => [String(o._id), o]));
    res.json({
      markedOverdue: overdue.length,
      followups: overdue.map((f) => ({
        ...f,
        owner: ownerMap.get(String((f.businessId as { ownerId?: unknown })?.ownerId)) || null,
      })),
    });
  })
);

/** n8n posts composed notifications/emails here after building its own logic */
router.post(
  '/notify',
  asyncHandler(async (req, res) => {
    const { notifications, emails } = req.body as {
      notifications?: { userId: string; businessId: string; type?: string; message: string }[];
      emails?: { to: string; subject: string; html?: string; body?: string }[];
    };
    if (!Array.isArray(notifications) && !Array.isArray(emails)) {
      throw badRequest('Provide notifications[] and/or emails[]');
    }
    let created = 0;
    if (Array.isArray(notifications)) {
      for (const n of notifications) {
        if (!n.userId || !n.businessId || !n.message) continue;
        // sanity: the target must belong to that business
        const member = await Membership.findOne({ userId: n.userId, businessId: n.businessId });
        if (!member) continue;
        await Notification.create({
          businessId: n.businessId,
          userId: n.userId,
          type: n.type || 'GENERAL',
          message: n.message,
        });
        created++;
      }
    }
    let sent = 0;
    if (Array.isArray(emails)) {
      for (const e of emails) {
        if (!e.to || !e.subject) continue;
        await sendEmail(e.to, e.subject, e.html || emailShell(e.subject, e.body || ''));
        sent++;
      }
    }
    res.json({ notificationsCreated: created, emailsSent: sent });
  })
);

/** One-shot: run a complete built-in job (simplest n8n setup = 1 HTTP node per schedule) */
router.post(
  '/run/:job',
  asyncHandler(async (req, res) => {
    const job = JOBS[req.params.job];
    if (!job) throw notFound(`Unknown job. Valid: ${Object.keys(JOBS).join(', ')}`);
    const result = await job();
    res.json(result);
  })
);

/** Quick health/info endpoint for n8n connectivity tests */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const businesses = await Business.countDocuments();
    res.json({ ok: true, date: istToday(), businesses, jobs: Object.keys(JOBS) });
  })
);

export default router;
