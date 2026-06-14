import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { requireOwnership, requireMembership, resolveScope } from '../middleware/scope';
import { asyncHandler } from '../utils/errors';
import { Payment } from '../models/Payment';
import { TimeEntry } from '../models/TimeEntry';
import { Task } from '../models/Task';
import { PerformanceScore } from '../models/PerformanceScore';
import { EmployeeProfile } from '../models/EmployeeProfile';

const router = Router();
router.use(requireAuth);

// GET /api/payments?businessId=xxx&period=2024-01
router.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId, period, userId } = req.query as { businessId: string; period: string; userId: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const scope = await resolveScope(req.userId!, businessId, { ownerOnly: true });

  const filter: Record<string, unknown> = { businessId: { $in: scope.businessIds } };
  if (period) filter.period = period;
  if (userId) filter.userId = userId;

  const payments = await Payment.find(filter)
    .populate('userId', 'name email')
    .populate('approvedBy', 'name')
    .sort({ period: -1 })
    .lean();

  res.json({ payments });
}));

// GET /api/payments/my?businessId=xxx
router.get('/my', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.query as { businessId: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireMembership(req.userId!, businessId);

  const payments = await Payment.find({ businessId, userId: req.userId })
    .sort({ period: -1 }).lean();
  res.json({ payments });
}));

// POST /api/payments/generate
router.post('/generate', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId, userId, period } = req.body;
  if (!businessId || !userId || !period) return res.status(400).json({ error: 'businessId, userId, period required' });
  await requireOwnership(req.userId!, businessId);

  const [year, month] = period.split('-').map(Number);
  const startDate = `${period}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const timeEntries = await TimeEntry.find({
    businessId, userId,
    date: { $gte: startDate, $lte: endDate },
  }).lean();
  const totalMinutes = timeEntries.reduce((sum: number, t: { minutes: number }) => sum + t.minutes, 0);
  const actualHours = Math.round(totalMinutes / 60 * 10) / 10;

  const tasksCompleted = await Task.countDocuments({
    businessId, assigneeId: userId,
    status: 'DONE',
    completedAt: { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') },
  });

  const scores = await PerformanceScore.find({
    businessId, userId,
    date: { $gte: startDate, $lte: endDate },
  }).lean();
  const avgScore = scores.length
    ? Math.round(scores.reduce((s: number, x: { score: number }) => s + x.score, 0) / scores.length)
    : 0;

  const profile = await EmployeeProfile.findOne({ businessId, userId }).lean();
  const baseSalary = profile?.salary || 0;
  const bonusAmount = avgScore > 80 ? Math.round(baseSalary * 0.1) : 0;

  const existing = await Payment.findOne({ businessId, userId, period });
  if (existing) {
    existing.actualHoursWorked = actualHours;
    existing.tasksCompleted = tasksCompleted;
    existing.performanceScore = avgScore;
    existing.baseSalary = baseSalary;
    existing.bonusAmount = bonusAmount;
    existing.totalAmount = baseSalary + bonusAmount - existing.deductionAmount;
    await existing.save();
    return res.json({ payment: existing });
  }

  const payment = await Payment.create({
    businessId, userId, period,
    baseSalary, bonusAmount, deductionAmount: 0,
    totalAmount: baseSalary + bonusAmount,
    actualHoursWorked: actualHours,
    tasksCompleted, performanceScore: avgScore,
    status: 'DRAFT',
    currency: profile?.currency || 'INR',
  });

  res.status(201).json({ payment });
}));

// PATCH /api/payments/:id
router.patch('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId, status, baseSalary, bonusAmount, deductionAmount, notes } = req.body as {
    businessId?: string;
    status?: string;
    baseSalary?: number;
    bonusAmount?: number;
    deductionAmount?: number;
    notes?: string;
  };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);

  const allowed_statuses = ['DRAFT', 'PENDING', 'APPROVED', 'PAID'];
  const update: Record<string, unknown> = {};

  if (status !== undefined) {
    if (!allowed_statuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    update.status = status;
    if (status === 'APPROVED') update.approvedBy = req.userId;
    if (status === 'PAID') { update.paidAt = new Date(); update.approvedBy = req.userId; }
  }
  if (notes !== undefined) update.notes = notes;

  if (baseSalary !== undefined || bonusAmount !== undefined || deductionAmount !== undefined) {
    const existing = await Payment.findById(req.params.id).lean();
    if (existing) {
      const base = baseSalary ?? existing.baseSalary;
      const bonus = bonusAmount ?? existing.bonusAmount;
      const deduct = deductionAmount ?? existing.deductionAmount;
      if (baseSalary !== undefined) update.baseSalary = base;
      if (bonusAmount !== undefined) update.bonusAmount = bonus;
      if (deductionAmount !== undefined) update.deductionAmount = deduct;
      update.totalAmount = base + bonus - deduct;
    }
  }

  const payment = await Payment.findByIdAndUpdate(req.params.id, { $set: update }, { new: true })
    .populate('userId', 'name email')
    .populate('approvedBy', 'name');
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  res.json({ payment });
}));

export default router;
