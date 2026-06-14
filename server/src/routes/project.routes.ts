import { Router } from 'express';
import { Types } from 'mongoose';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { requireOwnership, requireMembership, resolveScope } from '../middleware/scope';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { TimeEntry } from '../models/TimeEntry';
import { asyncHandler, badRequest, notFound } from '../utils/errors';

const router = Router();
router.use(requireAuth);

/** List projects in a business (owner only) */
router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const businessIdParam = String(req.query.businessId || '');
    if (!businessIdParam) throw badRequest('businessId is required');

    const scope = await resolveScope(req.userId!, businessIdParam, { ownerOnly: true });
    const projects = await Project.find({ businessId: { $in: scope.businessIds } }).sort({ createdAt: -1 }).lean();

    // Enrich with calculated fields
    const enriched = await Promise.all(
      projects.map(async (p) => {
        const tasks = await Task.find({ projectId: p._id }).lean();
        const actualHours = tasks.length
          ? await TimeEntry.aggregate([
              { $match: { businessId: new Types.ObjectId(String(p.businessId)), taskId: { $in: tasks.map((t) => t._id) } } },
              { $group: { _id: null, total: { $sum: '$minutes' } } },
            ])
          : [];

        const actual = (actualHours[0]?.total || 0) / 60;
        const variance = actual - p.estimatedHours;
        const varPercent = p.estimatedHours > 0 ? ((variance / p.estimatedHours) * 100).toFixed(1) : '0';
        const cost = actual * (p.costRate ?? p.hourlyRate);
        const revenue = actual * p.hourlyRate;
        const profit = revenue - cost;

        return {
          ...p,
          actualHours: actual,
          variance,
          variancePercent: parseFloat(varPercent),
          cost,
          revenue,
          profit,
          profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0',
          efficiency: p.estimatedHours > 0 && actual > 0 ? ((p.estimatedHours / actual) * 100).toFixed(1) : '100',
        };
      })
    );

    res.json({ projects: enriched });
  })
);

/** Create a project */
router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { businessId, name, description, estimatedHours, hourlyRate, costRate, startDate } = req.body as {
      businessId?: string;
      name?: string;
      description?: string;
      estimatedHours?: number;
      hourlyRate?: number;
      costRate?: number;
      startDate?: string;
    };

    if (!businessId || !name?.trim() || !estimatedHours || estimatedHours < 1 || !hourlyRate || hourlyRate < 0) {
      throw badRequest('businessId, name, estimatedHours (≥1), and hourlyRate are required');
    }

    await requireOwnership(req.userId!, businessId);

    const project = await Project.create({
      businessId,
      name: name.trim(),
      description: description?.trim(),
      estimatedHours,
      hourlyRate,
      costRate: costRate || hourlyRate,
      startDate: startDate ? new Date(startDate) : undefined,
      status: 'planning',
    });

    res.status(201).json({ project });
  })
);

/** Get project detail with task breakdown */
router.get(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) throw notFound('Project not found');
    await requireOwnership(req.userId!, String(project.businessId));

    const tasks = await Task.find({ projectId: project._id }).populate('assigneeId', 'name email').lean();

    const taskDetails = await Promise.all(
      tasks.map(async (t) => {
        const timeEntries = await TimeEntry.find({ taskId: t._id }).lean();
        const minutes = timeEntries.reduce((s, e) => s + e.minutes, 0);
        const hours = minutes / 60;
        return {
          ...t,
          actualHours: hours,
          variance: (hours - (t.estimatedHours || 0)).toFixed(2),
          cost: hours * (t.hourlyRate || project.hourlyRate),
        };
      })
    );

    const totalHours = taskDetails.reduce((s, t) => s + (t.actualHours || 0), 0);
    const revenue = totalHours * project.hourlyRate;
    const cost = totalHours * (project.costRate ?? project.hourlyRate);
    const profit = revenue - cost;

    res.json({
      project,
      tasks: taskDetails,
      summary: {
        estimatedHours: project.estimatedHours,
        actualHours: totalHours.toFixed(2),
        variance: (totalHours - project.estimatedHours).toFixed(2),
        revenue: revenue.toFixed(2),
        cost: cost.toFixed(2),
        profit: profit.toFixed(2),
        profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0',
        efficiency: project.estimatedHours > 0 && totalHours > 0 ? ((project.estimatedHours / totalHours) * 100).toFixed(1) : '100',
      },
    });
  })
);

/** Update project */
router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) throw notFound('Project not found');
    await requireOwnership(req.userId!, String(project.businessId));

    const { name, description, estimatedHours, hourlyRate, costRate, status, endDate } = req.body as Record<
      string,
      unknown
    >;

    if (name) project.name = (name as string).trim();
    if (description !== undefined) project.description = (description as string)?.trim();
    if (estimatedHours) project.estimatedHours = estimatedHours as number;
    if (hourlyRate !== undefined) project.hourlyRate = hourlyRate as number;
    if (costRate !== undefined) project.costRate = costRate as number;
    if (status && ['planning', 'active', 'completed', 'on-hold'].includes(status as string)) {
      project.status = status as any;
    }
    if (endDate) project.endDate = new Date(endDate as string);

    await project.save();
    res.json({ project });
  })
);

export default router;
