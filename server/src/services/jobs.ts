import { Types } from 'mongoose';
import { Business } from '../models/Business';
import { DailyLog } from '../models/DailyLog';
import { FollowUp, IFollowUp } from '../models/FollowUp';
import { Membership } from '../models/Membership';
import { Task } from '../models/Task';
import { TimeEntry } from '../models/TimeEntry';
import { IUser, User } from '../models/User';
import { formatIst, istDayEnd, istDayStart, istToday } from '../utils/dates';
import { notify } from './notify';

/**
 * The four Phase-1 automations. Each is callable two ways:
 *  - POST /api/automation/run/:job  → one-shot HTTP call from n8n (or anything)
 *  - internal node-cron fallback    → when ENABLE_INTERNAL_CRON=true
 * Granular read endpoints also exist so custom n8n flows can build their own logic.
 */

async function userById(id: Types.ObjectId): Promise<IUser | null> {
  return User.findById(id).lean<IUser>();
}

async function businessOwner(businessId: Types.ObjectId) {
  const business = await Business.findById(businessId).lean();
  if (!business) return null;
  const owner = await userById(business.ownerId);
  return owner ? { business, owner } : null;
}

/** 1. Morning reminder: follow-ups due today, per member */
export async function runFollowupDueReminders() {
  const today = istToday();
  const due = await FollowUp.find({
    status: 'PENDING',
    dueAt: { $gte: istDayStart(today), $lt: istDayEnd(today) },
  }).lean<IFollowUp[]>();

  // group by user+business so each member gets one consolidated notification
  const groups = new Map<string, IFollowUp[]>();
  for (const f of due) {
    const key = `${f.userId}:${f.businessId}`;
    groups.set(key, [...(groups.get(key) || []), f]);
  }

  let notified = 0;
  for (const items of groups.values()) {
    const user = await userById(items[0].userId);
    if (!user) continue;
    const names = items.map((f) => f.clientName).join(', ');
    const list = items
      .map((f) => `<li><b>${f.clientName}</b>${f.note ? ` — ${f.note}` : ''} (by ${formatIst(f.dueAt)})</li>`)
      .join('');
    await notify({
      businessId: items[0].businessId,
      userId: user._id,
      type: 'FOLLOWUP_DUE',
      message: `Aaj ke follow-ups (${items.length}): ${names}`,
      email: {
        to: user.email,
        subject: `⏰ ${items.length} follow-up${items.length > 1 ? 's' : ''} due today`,
        bodyHtml: `<p>Namaste ${user.name},</p><p>These client follow-ups are due today:</p><ul>${list}</ul>`,
      },
    });
    notified++;
  }
  return { job: 'followup-due', followupsDue: due.length, membersNotified: notified };
}

/** 2. Overdue escalation: PENDING follow-ups past dueAt → OVERDUE, notify member + owner */
export async function runFollowupOverdueEscalation() {
  const now = new Date();
  const overdue = await FollowUp.find({ status: 'PENDING', dueAt: { $lt: now } }).lean<IFollowUp[]>();
  if (overdue.length) {
    await FollowUp.updateMany(
      { _id: { $in: overdue.map((f) => f._id) } },
      { $set: { status: 'OVERDUE' } }
    );
  }

  for (const f of overdue) {
    const user = await userById(f.userId);
    const ownerInfo = await businessOwner(f.businessId);
    if (user) {
      await notify({
        businessId: f.businessId,
        userId: user._id,
        type: 'FOLLOWUP_OVERDUE',
        message: `Follow-up OVERDUE: ${f.clientName} (was due ${formatIst(f.dueAt)})`,
        email: {
          to: user.email,
          subject: `🔴 Follow-up overdue: ${f.clientName}`,
          bodyHtml: `<p>Your follow-up with <b>${f.clientName}</b> was due ${formatIst(f.dueAt)} and is now marked <b>OVERDUE</b>. Please close it today.</p>`,
        },
      });
    }
    // escalate to the owner (skip self-escalation when the owner is the assignee)
    if (ownerInfo && String(ownerInfo.owner._id) !== String(f.userId)) {
      await notify({
        businessId: f.businessId,
        userId: ownerInfo.owner._id,
        type: 'FOLLOWUP_ESCALATION',
        message: `${user?.name || 'A member'} ka follow-up overdue: ${f.clientName} (${ownerInfo.business.name})`,
        email: {
          to: ownerInfo.owner.email,
          subject: `⚠️ Escalation: ${user?.name || 'member'}'s follow-up with ${f.clientName} is overdue`,
          bodyHtml: `<p>In <b>${ownerInfo.business.name}</b>, the follow-up with <b>${f.clientName}</b> assigned to <b>${user?.name || 'a member'}</b> passed its due time (${formatIst(f.dueAt)}) without being closed.</p>`,
        },
      });
    }
  }
  return { job: 'followup-overdue', markedOverdue: overdue.length };
}

/** 3. Evening nudge: members who logged no TimeEntry and no DailyLog today */
export async function runDailyNudge() {
  const today = istToday();
  const memberships = await Membership.find({}).lean();

  const [timeUserIds, logUserIds] = await Promise.all([
    TimeEntry.distinct('userId', { date: today }),
    DailyLog.distinct('userId', { date: today }),
  ]);
  const loggedSet = new Set([...timeUserIds, ...logUserIds].map(String));

  // one nudge per user (not per business) — pick their first membership for scoping
  const nudgedUsers = new Set<string>();
  let nudged = 0;
  for (const m of memberships) {
    const uid = String(m.userId);
    if (loggedSet.has(uid) || nudgedUsers.has(uid)) continue;
    nudgedUsers.add(uid);
    const user = await userById(m.userId);
    if (!user) continue;
    await notify({
      businessId: m.businessId,
      userId: m.userId,
      type: 'DAILY_NUDGE',
      message: 'Aaj ka hisaab baaki hai — log your hours & end-of-day summary before you wrap up!',
      email: {
        to: user.email,
        subject: '📝 Daily log pending — 2 minute ka kaam',
        bodyHtml: `<p>Hi ${user.name},</p><p>You haven't logged any time or an end-of-day summary today. It takes 2 minutes — please update your day in Pulse CRM.</p>`,
      },
    });
    nudged++;
  }
  return { job: 'daily-nudge', membersNudged: nudged };
}

/** 4. Overdue task alert: tasks past dueAt and not DONE → notify assignee + owner, once per task */
export async function runOverdueTaskAlerts() {
  const now = new Date();
  const tasks = await Task.find({
    status: { $ne: 'DONE' },
    dueAt: { $lt: now },
    overdueNotifiedAt: null,
  }).lean();

  for (const t of tasks) {
    await Task.updateOne({ _id: t._id }, { $set: { overdueNotifiedAt: now } });
    const assignee = await userById(t.assigneeId);
    const ownerInfo = await businessOwner(t.businessId);
    if (assignee) {
      await notify({
        businessId: t.businessId,
        userId: t.assigneeId,
        type: 'TASK_OVERDUE',
        message: `Task overdue: "${t.title}" (was due ${formatIst(t.dueAt!)})`,
        email: {
          to: assignee.email,
          subject: `🔴 Task overdue: ${t.title}`,
          bodyHtml: `<p>Your task <b>${t.title}</b> was due ${formatIst(t.dueAt!)} and is still ${t.status.replace('_', ' ').toLowerCase()}.</p>`,
        },
      });
    }
    if (ownerInfo && String(ownerInfo.owner._id) !== String(t.assigneeId)) {
      await notify({
        businessId: t.businessId,
        userId: ownerInfo.owner._id,
        type: 'TASK_OVERDUE',
        message: `${assignee?.name || 'A member'} ka task overdue: "${t.title}" (${ownerInfo.business.name})`,
        email: {
          to: ownerInfo.owner.email,
          subject: `⚠️ ${assignee?.name || 'Member'}'s task "${t.title}" is overdue`,
          bodyHtml: `<p>In <b>${ownerInfo.business.name}</b>, the task <b>${t.title}</b> assigned to <b>${assignee?.name || 'a member'}</b> passed its due time (${formatIst(t.dueAt!)}).</p>`,
        },
      });
    }
  }
  return { job: 'overdue-tasks', tasksAlerted: tasks.length };
}

export const JOBS: Record<string, () => Promise<unknown>> = {
  'followup-due': runFollowupDueReminders,
  'followup-overdue': runFollowupOverdueEscalation,
  'daily-nudge': runDailyNudge,
  'overdue-tasks': runOverdueTaskAlerts,
};
