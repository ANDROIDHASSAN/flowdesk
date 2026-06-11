import { Router } from 'express';
import { Types } from 'mongoose';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { requireOwnership } from '../middleware/scope';
import { PerformanceScore } from '../models/PerformanceScore';
import { ChatHistory } from '../models/ChatHistory';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { Membership } from '../models/Membership';
import { FollowUp } from '../models/FollowUp';
import { Business } from '../models/Business';
import { calculatePerformanceScore, aggregateTeamData } from '../services/analytics';
import { generateAISummary, chatWithAI, generateInsights } from '../services/ai';
import { asyncHandler, badRequest, notFound } from '../utils/errors';

const router = Router();
router.use(requireAuth);

/** Build a rich context snapshot of the entire business for the AI */
async function buildRichContext(businessId: string) {
  const [business, members, tasks, projects, followups, perfScores] = await Promise.all([
    Business.findById(businessId).lean(),
    Membership.find({ businessId }).populate('userId', 'name email').lean(),
    Task.find({ businessId }).populate('assigneeId', 'name').sort({ createdAt: -1 }).limit(200).lean(),
    Project.find({ businessId }).sort({ updatedAt: -1 }).lean(),
    FollowUp.find({ businessId }).populate('userId', 'name').sort({ createdAt: -1 }).limit(100).lean(),
    PerformanceScore.find({ businessId }).sort({ date: -1 }).limit(50).lean(),
  ]);

  // Summarise tasks by status & assignee
  const taskSummary = {
    total: tasks.length,
    todo: tasks.filter((t: any) => t.status === 'TODO').length,
    inProgress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
    done: tasks.filter((t: any) => t.status === 'DONE').length,
    highPriority: tasks.filter((t: any) => t.priority === 'HIGH').length,
    overdue: tasks.filter((t: any) => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'DONE').length,
  };

  // Per-member task breakdown
  const memberStats: Record<string, any> = {};
  members.forEach((m: any) => {
    const uid = m.userId?._id?.toString();
    if (!uid) return;
    const myTasks = tasks.filter((t: any) => t.assigneeId?._id?.toString() === uid || String(t.assigneeId) === uid);
    const myFollowups = followups.filter((f: any) => f.userId?._id?.toString() === uid || String(f.userId) === uid);
    const latestScore = perfScores.find((s: any) => String(s.userId) === uid);
    memberStats[uid] = {
      name: m.userId?.name || m.displayName,
      role: m.role,
      tasks: { total: myTasks.length, done: myTasks.filter((t: any) => t.status === 'DONE').length, inProgress: myTasks.filter((t: any) => t.status === 'IN_PROGRESS').length, overdue: myTasks.filter((t: any) => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'DONE').length },
      followups: { total: myFollowups.length, done: myFollowups.filter((f: any) => f.status === 'DONE').length, overdue: myFollowups.filter((f: any) => f.status === 'OVERDUE').length },
      performanceScore: latestScore ? { score: latestScore.score, date: latestScore.date } : null,
    };
  });

  // Project summaries
  const projectSummary = projects.map((p: any) => ({
    name: p.name,
    status: p.status,
    estimatedHours: p.estimatedHours,
    actualHours: p.actualHours || 0,
    hourlyRate: p.hourlyRate,
    profit: p.actualHours ? Math.round((p.hourlyRate - (p.costRate || 0)) * p.actualHours) : null,
    overBudget: p.actualHours && p.estimatedHours ? p.actualHours > p.estimatedHours : false,
    endDate: p.endDate,
  }));

  // Follow-up summary
  const followupSummary = {
    total: followups.length,
    done: followups.filter((f: any) => f.status === 'DONE').length,
    overdue: followups.filter((f: any) => f.status === 'OVERDUE').length,
    pending: followups.filter((f: any) => f.status === 'PENDING').length,
  };

  // Recent tasks (last 10 for context)
  const recentTasks = tasks.slice(0, 10).map((t: any) => ({
    title: t.title,
    status: t.status,
    priority: t.priority,
    assignee: (t.assigneeId as any)?.name || 'Unassigned',
    dueAt: t.dueAt,
    overdue: t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'DONE',
  }));

  return {
    business: { name: (business as any)?.name || 'Your Business' },
    taskSummary,
    memberStats,
    projectSummary,
    followupSummary,
    recentTasks,
    dataAsOf: new Date().toISOString(),
  };
}

/** Get performance scores for all team members */
router.get(
  '/performance',
  asyncHandler(async (req: AuthedRequest, res) => {
    const businessId = String(req.query.businessId || '');
    if (!businessId) throw badRequest('businessId is required');
    await requireOwnership(req.userId!, businessId);
    const scores = await PerformanceScore.find({ businessId }).sort({ date: -1 }).limit(100).lean();
    res.json({ scores });
  })
);

/** Detailed employee analysis */
router.get(
  '/employee/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const businessId = String(req.query.businessId || '');
    if (!businessId) throw badRequest('businessId is required');
    await requireOwnership(req.userId!, businessId);

    const scores = await PerformanceScore.find({ businessId, userId: req.params.id })
      .sort({ date: -1 }).limit(30).lean();

    if (!scores.length) return res.json({ scores: [], summary: 'No data available yet' });

    const latest = scores[0];
    const weekAvg = Math.round(scores.slice(0, 7).reduce((s, sc) => s + sc.score, 0) / Math.min(7, scores.length));
    res.json({
      scores,
      latest,
      weekAverage: weekAvg,
      trend: weekAvg > (scores[7]?.score || weekAvg) ? 'improving' : 'declining',
      summary: latest.summary,
    });
  })
);

/** Chat with AI — full real-data context */
router.post(
  '/chat',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { businessId, message } = req.body as { businessId?: string; message?: string };
    if (!businessId || !message?.trim()) throw badRequest('businessId and message are required');
    if (businessId === 'all') throw badRequest('Select a specific business to use the AI assistant');
    await requireOwnership(req.userId!, businessId);

    // Get or create chat history
    let chatHistory = await ChatHistory.findOne({ businessId, userId: req.userId });
    if (!chatHistory) {
      chatHistory = await ChatHistory.create({ businessId, userId: req.userId, messages: [] });
    }

    // Build rich real-data context
    const richContext = await buildRichContext(businessId);

    // Recent conversation context (last 10 messages)
    const recentMessages = chatHistory.messages.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const messagesForAI = [
      ...recentMessages,
      { role: 'user' as const, content: message },
    ];

    const aiResponse = await chatWithAI(messagesForAI, richContext);

    // Persist conversation
    chatHistory.messages.push(
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: aiResponse, timestamp: new Date() }
    );
    chatHistory.lastUpdated = new Date();
    if (chatHistory.messages.length > 50) chatHistory.messages = chatHistory.messages.slice(-50);
    await chatHistory.save();

    res.json({
      message: aiResponse,
      history: chatHistory.messages.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
    });
  })
);

/** Get chat history */
router.get(
  '/chat',
  asyncHandler(async (req: AuthedRequest, res) => {
    const businessId = String(req.query.businessId || '');
    if (!businessId || businessId === 'all') return res.json({ messages: [] });
    await requireOwnership(req.userId!, businessId);

    const chatHistory = await ChatHistory.findOne({ businessId, userId: req.userId });
    if (!chatHistory) return res.json({ messages: [] });

    res.json({
      messages: chatHistory.messages.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
    });
  })
);

/** Key business insights */
router.get(
  '/insights',
  asyncHandler(async (req: AuthedRequest, res) => {
    const businessId = String(req.query.businessId || '');
    if (!businessId || businessId === 'all') throw badRequest('businessId is required');
    await requireOwnership(req.userId!, businessId);

    const richContext = await buildRichContext(businessId);
    const insights = await generateInsights(richContext as unknown as Record<string, unknown>);
    res.json({ insights });
  })
);

export default router;
