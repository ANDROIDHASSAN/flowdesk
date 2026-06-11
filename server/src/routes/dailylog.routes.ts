import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { requireMembership, resolveScope } from '../middleware/scope';
import { DailyLog } from '../models/DailyLog';
import { asyncHandler, badRequest } from '../utils/errors';

const router = Router();
router.use(requireAuth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** GET /api/daily-logs?businessId=&userId=&from=&to= — members self-only, owners any member */
router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const businessIdParam = String(req.query.businessId || 'all');
    const userIdParam = req.query.userId ? String(req.query.userId) : undefined;
    const viewingOther = userIdParam && userIdParam !== req.userId;
    const scope = await resolveScope(req.userId!, businessIdParam, { ownerOnly: !!viewingOther });

    const filter: Record<string, unknown> = {
      businessId: { $in: scope.businessIds },
      userId: viewingOther ? userIdParam : req.userId,
    };
    const range: Record<string, string> = {};
    if (DATE_RE.test(String(req.query.from || ''))) range.$gte = String(req.query.from);
    if (DATE_RE.test(String(req.query.to || ''))) range.$lte = String(req.query.to);
    if (Object.keys(range).length) filter.date = range;

    const logs = await DailyLog.find(filter)
      .populate('businessId', 'name')
      .sort({ date: -1 })
      .limit(120)
      .lean();
    res.json({ logs });
  })
);

/** Upsert today's (or a given day's) end-of-day summary for the caller */
router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { businessId, date, summary } = req.body as {
      businessId?: string;
      date?: string;
      summary?: string;
    };
    if (!businessId) throw badRequest('businessId is required');
    if (!date || !DATE_RE.test(date)) throw badRequest('date must be YYYY-MM-DD');
    if (!summary?.trim()) throw badRequest('summary is required');
    await requireMembership(req.userId!, businessId);

    const log = await DailyLog.findOneAndUpdate(
      { businessId, userId: req.userId, date },
      { $set: { summary: summary.trim() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ log });
  })
);

export default router;
