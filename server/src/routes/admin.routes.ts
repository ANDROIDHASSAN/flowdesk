import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { requireOwnership } from '../middleware/scope';
import { asyncHandler } from '../utils/errors';
import { Membership } from '../models/Membership';
import { Task } from '../models/Task';
import { TimeEntry } from '../models/TimeEntry';
import { FollowUp } from '../models/FollowUp';
import { DailyLog } from '../models/DailyLog';
import { PerformanceScore } from '../models/PerformanceScore';
import { Streak } from '../models/Streak';
import { EmployeeProfile } from '../models/EmployeeProfile';
import { Payment } from '../models/Payment';
import { istToday } from '../utils/dates';

const router = Router();
router.use(requireAuth);

// GET /api/admin/overview?businessId=xxx
router.get('/overview', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.query as { businessId: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);

  const today = istToday();
  const thisMonth = today.substring(0, 7);
  const monthStart = `${thisMonth}-01`;

  const [
    totalMembers, totalTasks, completedTasks, overdueTasks,
    totalTimeEntries, todayTimeEntries, logsToday, pendingFollowups,
  ] = await Promise.all([
    Membership.countDocuments({ businessId }),
    Task.countDocuments({ businessId }),
    Task.countDocuments({ businessId, status: 'DONE' }),
    Task.countDocuments({ businessId, status: { $ne: 'DONE' }, dueAt: { $lt: new Date() } }),
    TimeEntry.countDocuments({ businessId, date: { $gte: monthStart } }),
    TimeEntry.countDocuments({ businessId, date: today }),
    DailyLog.countDocuments({ businessId, date: today }),
    FollowUp.countDocuments({ businessId, status: 'PENDING' }),
  ]);

  const totalMinutes = await TimeEntry.aggregate([
    { $match: { businessId, date: { $gte: monthStart } } },
    { $group: { _id: null, total: { $sum: '$minutes' } } },
  ]);

  res.json({
    overview: {
      totalMembers,
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalHoursThisMonth: Math.round((totalMinutes[0]?.total || 0) / 60),
      activeToday: todayTimeEntries,
      logsToday,
      pendingFollowups,
    },
  });
}));

// GET /api/admin/employees?businessId=xxx
router.get('/employees', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.query as { businessId: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);

  const today = istToday();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weekStart = sevenDaysAgo.toISOString().split('T')[0];

  const members = await Membership.find({ businessId }).populate('userId', 'name email').lean();

  const employeeData = await Promise.all(
    members.map(async (m) => {
      const uid = (m.userId as { _id: unknown })._id;
      const [
        activeTasks, completedThisWeek, todayTime, lastLog,
        streak, profile, pendingFollowups, score
      ] = await Promise.all([
        Task.countDocuments({ businessId, assigneeId: uid, status: { $in: ['TODO', 'IN_PROGRESS'] } }),
        Task.countDocuments({ businessId, assigneeId: uid, status: 'DONE', completedAt: { $gte: sevenDaysAgo } }),
        TimeEntry.aggregate([
          { $match: { businessId: m.businessId, userId: uid, date: today } },
          { $group: { _id: null, total: { $sum: '$minutes' } } }
        ]),
        DailyLog.findOne({ businessId, userId: uid, date: today }).lean(),
        Streak.findOne({ businessId, userId: uid }).lean(),
        EmployeeProfile.findOne({ businessId, userId: uid }).lean(),
        FollowUp.countDocuments({ businessId, userId: uid, status: 'PENDING' }),
        PerformanceScore.findOne({ businessId, userId: uid }).sort({ date: -1 }).lean(),
      ]);

      return {
        memberId: m._id,
        userId: uid,
        name: (m.userId as unknown as { name: string }).name,
        email: (m.userId as unknown as { email: string }).email,
        role: m.role,
        displayName: m.displayName,
        activeTasks,
        completedThisWeek,
        todayMinutes: (todayTime[0] as { total?: number } | undefined)?.total || 0,
        hasLoggedToday: !!lastLog,
        currentStreak: streak?.currentStreak || 0,
        xpPoints: streak?.xpPoints || 0,
        level: streak?.level || 1,
        pendingFollowups,
        latestScore: score?.score || 0,
        department: profile?.department,
        designation: profile?.designation,
        isOnVacation: profile?.isOnVacation || false,
        salary: profile?.salary,
        salaryType: profile?.salaryType,
      };
    })
  );

  res.json({ employees: employeeData });
}));

// GET /api/admin/activity?businessId=xxx&userId=xxx&days=30
router.get('/activity', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId, userId, days = '30' } = req.query as { businessId: string; userId: string; days: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(days));
  const fromDate = daysAgo.toISOString().split('T')[0];

  const filter: Record<string, unknown> = { businessId };
  if (userId) filter.userId = userId;

  const [tasks, timeEntries, logs, followups] = await Promise.all([
    Task.find({ ...filter, ...(userId && { assigneeId: userId }), updatedAt: { $gte: daysAgo } }).sort({ updatedAt: -1 }).limit(50).lean(),
    TimeEntry.find({ ...filter, date: { $gte: fromDate } }).sort({ date: -1 }).limit(100).lean(),
    DailyLog.find({ ...filter, date: { $gte: fromDate } }).sort({ date: -1 }).limit(50).lean(),
    FollowUp.find({ ...filter, updatedAt: { $gte: daysAgo } }).sort({ updatedAt: -1 }).limit(50).lean(),
  ]);

  res.json({ tasks, timeEntries, logs, followups });
}));

// GET /api/admin/performance?businessId=xxx
router.get('/performance', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId, period } = req.query as { businessId: string; period: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);

  const today = istToday();
  const dateFilter = period || today;

  const scores = await PerformanceScore.find({ businessId, date: dateFilter })
    .populate('userId', 'name email')
    .sort({ score: -1 })
    .lean();

  res.json({ scores });
}));

// GET /api/admin/summary?businessId=xxx
router.get('/summary', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId, period } = req.query as { businessId: string; period: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);

  const targetPeriod = period || istToday().substring(0, 7);

  const payments = await Payment.find({ businessId, period: targetPeriod })
    .populate('userId', 'name').lean();

  const totalPayroll = payments.reduce((s, p) => s + p.totalAmount, 0);
  const pending = payments.filter(p => p.status === 'PENDING' || p.status === 'DRAFT');
  const paid = payments.filter(p => p.status === 'PAID');

  res.json({
    summary: {
      period: targetPeriod,
      totalPayroll,
      pendingPayroll: pending.reduce((s, p) => s + p.totalAmount, 0),
      paidPayroll: paid.reduce((s, p) => s + p.totalAmount, 0),
      totalEmployees: payments.length,
      pendingCount: pending.length,
      paidCount: paid.length,
      payments,
    },
  });
}));

export default router;
