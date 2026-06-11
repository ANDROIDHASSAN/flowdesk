import { Router } from 'express';
import { Types } from 'mongoose';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { resolveScope } from '../middleware/scope';
import { DailyLog } from '../models/DailyLog';
import { FollowUp } from '../models/FollowUp';
import { Membership } from '../models/Membership';
import { Task } from '../models/Task';
import { TimeEntry } from '../models/TimeEntry';
import { istDayEnd, istDayStart, istToday, istWeekStart } from '../utils/dates';
import { asyncHandler, forbidden } from '../utils/errors';

const router = Router();
router.use(requireAuth);

/**
 * GET /api/dashboard/overview?businessId=all|id  (owner only)
 * Per-member performance cards + the "Needs attention" strip.
 */
router.get(
  '/overview',
  asyncHandler(async (req: AuthedRequest, res) => {
    const businessIdParam = String(req.query.businessId || 'all');
    const scope = await resolveScope(req.userId!, businessIdParam, { ownerOnly: true });
    const bizIds = scope.businessIds;
    const today = istToday();
    const weekStart = istWeekStart();
    const now = new Date();

    const memberships = await Membership.find({ businessId: { $in: bizIds } })
      .populate('userId', 'name email')
      .populate('businessId', 'name')
      .lean();

    const sumMinutes = (match: Record<string, unknown>) =>
      TimeEntry.aggregate<{ _id: Types.ObjectId; minutes: number }>([
        { $match: match },
        { $group: { _id: '$userId', minutes: { $sum: '$minutes' } } },
      ]);

    const [minutesToday, minutesWeek, openTasks, dueTodayFu, overdueFu, loggedTimeUsers, loggedDayUsers] =
      await Promise.all([
        sumMinutes({ businessId: { $in: bizIds }, date: today }),
        sumMinutes({ businessId: { $in: bizIds }, date: { $gte: weekStart, $lte: today } }),
        Task.aggregate<{ _id: Types.ObjectId; count: number }>([
          { $match: { businessId: { $in: bizIds }, status: { $ne: 'DONE' } } },
          { $group: { _id: '$assigneeId', count: { $sum: 1 } } },
        ]),
        FollowUp.aggregate<{ _id: Types.ObjectId; count: number }>([
          {
            $match: {
              businessId: { $in: bizIds },
              status: 'PENDING',
              dueAt: { $gte: istDayStart(today), $lt: istDayEnd(today) },
            },
          },
          { $group: { _id: '$userId', count: { $sum: 1 } } },
        ]),
        FollowUp.aggregate<{ _id: Types.ObjectId; count: number }>([
          {
            $match: {
              businessId: { $in: bizIds },
              $or: [{ status: 'OVERDUE' }, { status: 'PENDING', dueAt: { $lt: now } }],
            },
          },
          { $group: { _id: '$userId', count: { $sum: 1 } } },
        ]),
        TimeEntry.distinct('userId', { businessId: { $in: bizIds }, date: today }),
        DailyLog.distinct('userId', { businessId: { $in: bizIds }, date: today }),
      ]);

    const toMap = (rows: { _id: Types.ObjectId; [k: string]: unknown }[], key: string) =>
      new Map(rows.map((r) => [String(r._id), r[key] as number]));
    const mToday = toMap(minutesToday, 'minutes');
    const mWeek = toMap(minutesWeek, 'minutes');
    const mTasks = toMap(openTasks, 'count');
    const mDue = toMap(dueTodayFu, 'count');
    const mOver = toMap(overdueFu, 'count');
    const loggedSet = new Set([...loggedTimeUsers, ...loggedDayUsers].map(String));

    // collapse memberships to one card per user (combined "All businesses" view)
    const byUser = new Map<
      string,
      {
        userId: string;
        name: string;
        email: string;
        businesses: string[];
        roles: string[];
      }
    >();
    for (const m of memberships) {
      const u = m.userId as unknown as { _id: Types.ObjectId; name: string; email: string } | null;
      const b = m.businessId as unknown as { name: string } | null;
      if (!u) continue;
      const id = String(u._id);
      const entry = byUser.get(id) || { userId: id, name: u.name, email: u.email, businesses: [], roles: [] };
      if (b) entry.businesses.push(b.name);
      entry.roles.push(m.role);
      byUser.set(id, entry);
    }

    const members = [...byUser.values()].map((u) => ({
      ...u,
      isOwner: u.roles.includes('OWNER'),
      openTasks: mTasks.get(u.userId) || 0,
      minutesToday: mToday.get(u.userId) || 0,
      minutesWeek: mWeek.get(u.userId) || 0,
      followupsDueToday: mDue.get(u.userId) || 0,
      followupsOverdue: mOver.get(u.userId) || 0,
      loggedToday: loggedSet.has(u.userId),
    }));

    // ---- Needs attention strip ----
    const [overdueFollowups, overdueTasks] = await Promise.all([
      FollowUp.find({
        businessId: { $in: bizIds },
        $or: [{ status: 'OVERDUE' }, { status: 'PENDING', dueAt: { $lt: now } }],
      })
        .populate('userId', 'name')
        .populate('businessId', 'name')
        .sort({ dueAt: 1 })
        .limit(15)
        .lean(),
      Task.find({ businessId: { $in: bizIds }, status: { $ne: 'DONE' }, dueAt: { $lt: now } })
        .populate('assigneeId', 'name')
        .populate('businessId', 'name')
        .sort({ dueAt: 1 })
        .limit(15)
        .lean(),
    ]);
    const notLoggedToday = members.filter((m) => !m.loggedToday && !m.isOwner).map((m) => m.name);

    res.json({
      date: today,
      members: members.sort((a, b) => Number(a.isOwner) - Number(b.isOwner) || a.name.localeCompare(b.name)),
      needsAttention: { overdueFollowups, overdueTasks, notLoggedToday },
    });
  })
);

/**
 * GET /api/dashboard/member/:userId?businessId=all|id  (owner only)
 * One member's full picture: tasks, time, daily logs, follow-ups.
 */
router.get(
  '/member/:userId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const businessIdParam = String(req.query.businessId || 'all');
    const scope = await resolveScope(req.userId!, businessIdParam, { ownerOnly: true });
    const targetId = req.params.userId;

    // the target must actually belong to one of the owner's scoped businesses
    const targetMemberships = await Membership.find({
      userId: targetId,
      businessId: { $in: scope.businessIds },
    })
      .populate('userId', 'name email')
      .populate('businessId', 'name')
      .lean();
    if (targetMemberships.length === 0) throw forbidden('This person is not in your business');

    const bizIds = targetMemberships.map((m) => m.businessId);
    const fourteenDaysAgo = istToday().slice(0, 10);
    const fromDate = new Date(`${fourteenDaysAgo}T00:00:00Z`);
    fromDate.setUTCDate(fromDate.getUTCDate() - 14);
    const from = fromDate.toISOString().slice(0, 10);

    const [tasks, timeEntries, dailyLogs, followups] = await Promise.all([
      Task.find({ businessId: { $in: bizIds }, assigneeId: targetId })
        .populate('businessId', 'name')
        .sort({ status: 1, dueAt: 1 })
        .limit(100)
        .lean(),
      TimeEntry.find({ businessId: { $in: bizIds }, userId: targetId, date: { $gte: from } })
        .populate('taskId', 'title')
        .populate('businessId', 'name')
        .sort({ date: -1, createdAt: -1 })
        .limit(200)
        .lean(),
      DailyLog.find({ businessId: { $in: bizIds }, userId: targetId, date: { $gte: from } })
        .populate('businessId', 'name')
        .sort({ date: -1 })
        .lean(),
      FollowUp.find({ businessId: { $in: bizIds }, userId: targetId })
        .populate('businessId', 'name')
        .sort({ dueAt: 1 })
        .limit(100)
        .lean(),
    ]);

    const user = targetMemberships[0].userId;
    res.json({ user, memberships: targetMemberships, tasks, timeEntries, dailyLogs, followups });
  })
);

export default router;
