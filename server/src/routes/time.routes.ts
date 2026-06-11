import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { getMembership, requireMembership, resolveScope } from '../middleware/scope';
import { TimeEntry, TimeSource } from '../models/TimeEntry';
import { asyncHandler, badRequest, forbidden, notFound } from '../utils/errors';

const router = Router();
router.use(requireAuth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/time?businessId=&userId=&from=&to=
 * Members see only their own entries; owners may pass userId to view a member's.
 */
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

    const entries = await TimeEntry.find(filter)
      .populate('taskId', 'title')
      .populate('businessId', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(500)
      .lean();
    res.json({ entries });
  })
);

/** Log time (manual entry or timer stop) — always for the caller themselves */
router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { businessId, taskId, date, minutes, note, source } = req.body as {
      businessId?: string;
      taskId?: string;
      date?: string;
      minutes?: number;
      note?: string;
      source?: TimeSource;
    };
    if (!businessId) throw badRequest('businessId is required');
    if (!date || !DATE_RE.test(date)) throw badRequest('date must be YYYY-MM-DD');
    const mins = Math.round(Number(minutes));
    if (!Number.isFinite(mins) || mins < 1 || mins > 1440) {
      throw badRequest('minutes must be between 1 and 1440');
    }
    await requireMembership(req.userId!, businessId);

    const entry = await TimeEntry.create({
      businessId,
      userId: req.userId,
      taskId: taskId || undefined,
      date,
      minutes: mins,
      note: note?.trim(),
      source: source === 'TIMER' ? 'TIMER' : 'MANUAL',
    });
    res.status(201).json({ entry });
  })
);

/** Delete own entry (or owner deletes within their business) */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const entry = await TimeEntry.findById(req.params.id);
    if (!entry) throw notFound('Entry not found');
    if (String(entry.userId) !== req.userId) {
      const m = await getMembership(req.userId!, String(entry.businessId));
      if (!m || m.role !== 'OWNER') throw forbidden();
    }
    await entry.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
