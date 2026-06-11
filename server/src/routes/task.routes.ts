import { Router } from 'express';
import { Types } from 'mongoose';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { getMembership, requireMembership, resolveScope } from '../middleware/scope';
import { Task, TaskPriority, TaskStatus } from '../models/Task';
import { notify } from '../services/notify';
import { User } from '../models/User';
import { asyncHandler, badRequest, forbidden, notFound } from '../utils/errors';

const router = Router();
router.use(requireAuth);

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITIES: TaskPriority[] = ['LOW', 'MED', 'HIGH'];

/**
 * GET /api/tasks?businessId=all|id&assigneeId=&status=
 * Owners see every task in their businesses; members are hard-scoped to their own.
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
      filter.assigneeId = req.userId;
    } else {
      const scope = await resolveScope(req.userId!, businessIdParam, { ownerOnly: true });
      filter.businessId = { $in: scope.businessIds };
      if (req.query.assigneeId) filter.assigneeId = String(req.query.assigneeId);
    }
    if (req.query.status && STATUSES.includes(req.query.status as TaskStatus)) {
      filter.status = req.query.status;
    }
    const tasks = await Task.find(filter)
      .populate('assigneeId', 'name email')
      .populate('businessId', 'name')
      .sort({ dueAt: 1, createdAt: -1 })
      .limit(500)
      .lean();
    res.json({ tasks });
  })
);

/** Create a task. Members can only create for themselves; owners can assign to any member. */
router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { businessId, assigneeId, title, description, priority, dueAt } = req.body as {
      businessId?: string;
      assigneeId?: string;
      title?: string;
      description?: string;
      priority?: TaskPriority;
      dueAt?: string;
    };
    if (!businessId || !title?.trim()) throw badRequest('businessId and title are required');
    const membership = await requireMembership(req.userId!, businessId);

    let finalAssignee = req.userId!;
    if (assigneeId && assigneeId !== req.userId) {
      if (membership.role !== 'OWNER') throw forbidden('Only owners can assign tasks to others');
      const assigneeMembership = await getMembership(assigneeId, businessId);
      if (!assigneeMembership) throw badRequest('Assignee is not a member of this business');
      finalAssignee = assigneeId;
    }

    const task = await Task.create({
      businessId,
      assigneeId: finalAssignee,
      title: title.trim(),
      description: description?.trim(),
      priority: PRIORITIES.includes(priority as TaskPriority) ? priority : 'MED',
      dueAt: dueAt ? new Date(dueAt) : undefined,
    });

    if (finalAssignee !== req.userId) {
      const assignee = await User.findById(finalAssignee).lean();
      if (assignee) {
        await notify({
          businessId: new Types.ObjectId(businessId),
          userId: task.assigneeId,
          type: 'TASK_ASSIGNED',
          message: `Naya task assigned: "${task.title}"${task.dueAt ? ` (due ${task.dueAt.toLocaleDateString('en-IN')})` : ''}`,
        });
      }
    }
    res.status(201).json({ task });
  })
);

/** Update a task — status moves, edits, owner confirmation */
router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) throw notFound('Task not found');
    const membership = await getMembership(req.userId!, String(task.businessId));
    if (!membership) throw forbidden('You are not a member of this business');

    const isOwner = membership.role === 'OWNER';
    const isAssignee = String(task.assigneeId) === req.userId;
    if (!isOwner && !isAssignee) throw forbidden('You can only update your own tasks');

    const body = req.body as Partial<{
      title: string;
      description: string;
      status: TaskStatus;
      priority: TaskPriority;
      dueAt: string | null;
      assigneeId: string;
      confirmedByOwner: boolean;
    }>;

    if (body.title !== undefined) task.title = body.title.trim() || task.title;
    if (body.description !== undefined) task.description = body.description.trim();
    if (body.priority && PRIORITIES.includes(body.priority)) task.priority = body.priority;
    if (body.dueAt !== undefined) {
      task.dueAt = body.dueAt ? new Date(body.dueAt) : undefined;
      task.overdueNotifiedAt = undefined; // re-arm the overdue alert on reschedule
    }
    if (body.status && STATUSES.includes(body.status) && body.status !== task.status) {
      task.status = body.status;
      if (body.status === 'DONE') {
        task.completedAt = new Date();
      } else {
        task.completedAt = undefined;
        task.confirmedByOwner = false;
      }
    }
    if (body.confirmedByOwner !== undefined) {
      if (!isOwner) throw forbidden('Only the owner can confirm completion');
      if (task.status !== 'DONE') throw badRequest('Task must be DONE before confirming');
      task.confirmedByOwner = body.confirmedByOwner;
    }
    if (body.assigneeId && body.assigneeId !== String(task.assigneeId)) {
      if (!isOwner) throw forbidden('Only owners can reassign tasks');
      const am = await getMembership(body.assigneeId, String(task.businessId));
      if (!am) throw badRequest('Assignee is not a member of this business');
      task.assigneeId = new Types.ObjectId(body.assigneeId);
    }

    await task.save();
    res.json({ task });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) throw notFound('Task not found');
    const membership = await getMembership(req.userId!, String(task.businessId));
    if (!membership || membership.role !== 'OWNER') throw forbidden('Only owners can delete tasks');
    await task.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
