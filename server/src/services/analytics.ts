import { Types } from 'mongoose';
import { PerformanceScore } from '../models/PerformanceScore';
import { Task } from '../models/Task';
import { TimeEntry } from '../models/TimeEntry';
import { FollowUp } from '../models/FollowUp';
import { DailyLog } from '../models/DailyLog';
import { istToday } from '../utils/dates';

/**
 * Calculate performance score for a user on a given date
 * Base: 100 points
 * Deductions for missing targets, bonuses for exceeding
 */
export async function calculatePerformanceScore(
  businessId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
  date: string
): Promise<{
  score: number;
  breakdown: Record<string, number>;
  metrics: Record<string, number>;
}> {
  const startOfDay = new Date(`${date}T00:00:00.000+05:30`);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 3600_000);

  // Gather metrics
  const [tasksCompleted, tasksOnTime, hoursLogged, followupsClosed, followupsOverdue, daysLogged] =
    await Promise.all([
      Task.countDocuments({
        businessId,
        assigneeId: userId,
        status: 'DONE',
        completedAt: { $gte: startOfDay, $lt: endOfDay },
      }),
      Task.countDocuments({
        businessId,
        assigneeId: userId,
        status: 'DONE',
        completedAt: { $gte: startOfDay, $lt: endOfDay },
        dueAt: { $lte: new Date() },
      }),
      TimeEntry.aggregate([
        {
          $match: {
            businessId: new Types.ObjectId(businessId as string),
            userId: new Types.ObjectId(userId as string),
            date,
          },
        },
        { $group: { _id: null, total: { $sum: '$minutes' } } },
      ]),
      FollowUp.countDocuments({
        businessId,
        userId,
        status: 'DONE',
        closedAt: { $gte: startOfDay, $lt: endOfDay },
      }),
      FollowUp.countDocuments({
        businessId,
        userId,
        status: 'OVERDUE',
      }),
      DailyLog.countDocuments({
        businessId,
        userId,
        date: { $gte: date, $lte: date }, // Simplified check
      }),
    ]);

  const minutesLogged = hoursLogged[0]?.total || 0;
  const hours = minutesLogged / 60;

  // Calculate percentages
  const taskCompletion = tasksCompleted > 0 ? (tasksOnTime / tasksCompleted) * 100 : 100;
  const onTimeDelivery = tasksCompleted > 0 ? (tasksOnTime / tasksCompleted) * 100 : 100;
  const followupClosure = followupsClosed > 0 ? 95 : 100; // Simplified
  const consistency = daysLogged > 0 ? 100 : 50; // Full points if logged today
  const efficiency = hours >= 8 ? 100 : (hours / 8) * 100; // Target 8h/day

  // Base score: 100
  let score = 100;

  // Deductions (each metric has a target)
  score -= Math.max(0, (100 - taskCompletion) * 0.01); // -1 per % below 95%
  score -= Math.max(0, (100 - onTimeDelivery) * 0.005); // -0.5 per % below 100%
  score -= Math.max(0, (100 - followupClosure) * 0.015); // -1.5 per % below 95%
  score -= daysLogged === 0 ? 2 : 0; // -2 if no log
  score -= Math.max(0, (efficiency - 100) * 0.003); // -0.3 per % over estimate

  // Bonuses
  if (taskCompletion >= 95 && onTimeDelivery >= 100 && followupClosure >= 95) {
    score += 2; // All targets hit
  }
  if (hours > 8) {
    score += 0.5; // High utilization
  }
  if (followupsOverdue === 0 && followupClosure > 0) {
    score += 1; // No overdue follow-ups
  }

  score = Math.min(100, Math.max(0, score)); // Clamp 0-100

  return {
    score: Math.round(score),
    breakdown: {
      taskCompletion: Math.round(taskCompletion),
      onTimeDelivery: Math.round(onTimeDelivery),
      followupClosure: Math.round(followupClosure),
      consistency: Math.round(consistency),
      efficiency: Math.round(efficiency),
      bonus: Math.round(score - 100 + Math.round(taskCompletion * 0.01 + onTimeDelivery * 0.005)),
    },
    metrics: {
      tasksCompleted,
      tasksOnTime,
      hoursLogged: Math.round(hours * 10) / 10,
      followupsClosed,
      followupsOverdue,
    },
  };
}

/**
 * Aggregate team data for AI analysis
 */
export async function aggregateTeamData(businessId: Types.ObjectId | string, days: number = 7) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 3600_000);

  const [tasks, followups, timeEntries] = await Promise.all([
    Task.find({
      businessId,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate('assigneeId', 'name email')
      .lean(),
    FollowUp.find({
      businessId,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate('userId', 'name email')
      .lean(),
    TimeEntry.find({
      businessId,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate('userId', 'name')
      .lean(),
  ]);

  const teamStats = new Map<string, Record<string, unknown>>();

  // Aggregate by user
  tasks.forEach((task: any) => {
    const userId = task.assigneeId?._id?.toString() || 'unknown';
    if (!teamStats.has(userId)) {
      teamStats.set(userId, {
        userId,
        name: task.assigneeId?.name || 'Unknown',
        email: task.assigneeId?.email || '',
        tasks: 0,
        tasksCompleted: 0,
        tasksOnTime: 0,
      });
    }
    const stat = teamStats.get(userId) as Record<string, unknown>;
    (stat.tasks as number)++;
    if (task.status === 'DONE') {
      (stat.tasksCompleted as number)++;
      if (!task.dueAt || task.completedAt <= task.dueAt) {
        (stat.tasksOnTime as number)++;
      }
    }
  });

  followups.forEach((fu: any) => {
    const userId = fu.userId?._id?.toString() || 'unknown';
    if (!teamStats.has(userId)) {
      teamStats.set(userId, {
        userId,
        name: fu.userId?.name || 'Unknown',
        followups: 0,
        followupsClosed: 0,
      });
    }
    const stat = teamStats.get(userId) as Record<string, unknown>;
    (stat.followups as number) = ((stat.followups as number) || 0) + 1;
    if (fu.status === 'DONE') {
      (stat.followupsClosed as number) = ((stat.followupsClosed as number) || 0) + 1;
    }
  });

  timeEntries.forEach((entry: any) => {
    const userId = entry.userId?._id?.toString() || 'unknown';
    if (!teamStats.has(userId)) {
      teamStats.set(userId, {
        userId,
        name: entry.userId?.name || 'Unknown',
        hours: 0,
      });
    }
    const stat = teamStats.get(userId) as Record<string, unknown>;
    (stat.hours as number) = ((stat.hours as number) || 0) + entry.minutes / 60;
  });

  return {
    period: { startDate, endDate, days },
    team: Array.from(teamStats.values()),
    summary: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t: any) => t.status === 'DONE').length,
      totalFollowups: followups.length,
      totalHours: Math.round((timeEntries.reduce((s, e: any) => s + e.minutes, 0) / 60) * 10) / 10,
    },
  };
}
