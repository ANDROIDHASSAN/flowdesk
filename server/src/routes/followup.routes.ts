import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { getMembership, requireMembership, resolveScope } from '../middleware/scope';
import { FollowUp, FollowUpStatus } from '../models/FollowUp';
import { asyncHandler, badRequest, forbidden, notFound } from '../utils/errors';

const router = Router();
router.use(requireAuth);

const STATUSES: FollowUpStatus[] = ['PENDING', 'DONE', 'OVERDUE'];

/**
 * GET /api/followups?businessId=&status=&mine=true
 * mine=true → caller's own follow-ups (any role). Otherwise owner-only pipeline view.
 */
router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const businessIdParam = String(req.query.businessId || 'all');
    const mine = req.query.mine === 'true';

    const filter: Record<string, unknown> = {};
    if (mine) {
      const scope = await resolveScope(req.userId!, businessIdParam);
      filter.businessId = { $in: scope.businessIds };
      filter.userId = req.userId;
    } else {
      const scope = await resolveScope(req.userId!, businessIdParam, { ownerOnly: true });
      filter.businessId = { $in: scope.businessIds };
      if (req.query.userId) filter.userId = String(req.query.userId);
    }
    if (req.query.status && STATUSES.includes(req.query.status as FollowUpStatus)) {
      filter.status = req.query.status;
    }
    const followups = await FollowUp.find(filter)
      .populate('userId', 'name email')
      .populate('businessId', 'name')
      .sort({ dueAt: 1 })
      .limit(500)
      .lean();
    res.json({ followups });
  })
);

/** Create a follow-up. Members for themselves; owners may assign to a member. */
router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { businessId, userId, clientName, contact, note, dueAt } = req.body as {
      businessId?: string;
      userId?: string;
      clientName?: string;
      contact?: string;
      note?: string;
      dueAt?: string;
    };
    if (!businessId || !clientName?.trim() || !dueAt) {
      throw badRequest('businessId, clientName and dueAt are required');
    }
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) throw badRequest('dueAt is not a valid date');
    const membership = await requireMembership(req.userId!, businessId);

    let assignee = req.userId!;
    if (userId && userId !== req.userId) {
      if (membership.role !== 'OWNER') throw forbidden('Only owners can assign follow-ups to others');
      const am = await getMembership(userId, businessId);
      if (!am) throw badRequest('Assignee is not a member of this business');
      assignee = userId;
    }

    const followup = await FollowUp.create({
      businessId,
      userId: assignee,
      clientName: clientName.trim(),
      contact: contact?.trim(),
      note: note?.trim(),
      dueAt: due,
    });
    res.status(201).json({ followup });
  })
);

/** Update / close a follow-up */
router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const followup = await FollowUp.findById(req.params.id);
    if (!followup) throw notFound('Follow-up not found');
    const membership = await getMembership(req.userId!, String(followup.businessId));
    if (!membership) throw forbidden('You are not a member of this business');
    const isOwner = membership.role === 'OWNER';
    if (!isOwner && String(followup.userId) !== req.userId) {
      throw forbidden('You can only update your own follow-ups');
    }

    const body = req.body as Partial<{
      clientName: string;
      contact: string;
      note: string;
      dueAt: string;
      status: FollowUpStatus;
      outcome: string;
    }>;

    if (body.clientName !== undefined) followup.clientName = body.clientName.trim() || followup.clientName;
    if (body.contact !== undefined) followup.contact = body.contact.trim();
    if (body.note !== undefined) followup.note = body.note.trim();
    if (body.outcome !== undefined) followup.outcome = body.outcome.trim();
    if (body.dueAt) {
      const due = new Date(body.dueAt);
      if (Number.isNaN(due.getTime())) throw badRequest('dueAt is not a valid date');
      followup.dueAt = due;
      // a rescheduled overdue follow-up becomes pending again
      if (followup.status === 'OVERDUE' && due > new Date()) followup.status = 'PENDING';
    }
    if (body.status && STATUSES.includes(body.status) && body.status !== followup.status) {
      followup.status = body.status;
      followup.closedAt = body.status === 'DONE' ? new Date() : undefined;
    }

    await followup.save();
    res.json({ followup });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const followup = await FollowUp.findById(req.params.id);
    if (!followup) throw notFound('Follow-up not found');
    const membership = await getMembership(req.userId!, String(followup.businessId));
    const isOwner = membership?.role === 'OWNER';
    if (!isOwner && String(followup.userId) !== req.userId) throw forbidden();
    await followup.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
