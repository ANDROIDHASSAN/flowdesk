/**
 * End-to-end smoke test: boots an in-memory MongoDB + the real Express app,
 * then walks the entire Phase-1 surface over HTTP like a real client would.
 *
 *   npx tsx scripts/smoke.ts
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const PORT = 4123;
const BASE = `http://127.0.0.1:${PORT}/api`;
const SERVICE_TOKEN = 'smoke-service-token';

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.error(`  ❌ ${name} ${detail}`);
  }
}

async function api(
  path: string,
  opts: { method?: string; token?: string; service?: boolean; body?: unknown } = {}
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  if (opts.service) headers['x-service-token'] = SERVICE_TOKEN;
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, json: (await res.json().catch(() => ({}))) as any };
}

async function main() {
  console.log('Starting in-memory MongoDB…');
  const mem = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mem.getUri('pulsecrm');
  process.env.JWT_SECRET = 'smoke-jwt-secret';
  process.env.SERVICE_TOKEN = SERVICE_TOKEN;
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.PORT = String(PORT);
  process.env.ENABLE_INTERNAL_CRON = 'false';
  process.env.RESEND_API_KEY = '';

  console.log('Booting Pulse API…');
  await import('../src/index');
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log('\n— Auth & tenancy —');
  const owner = (await api('/auth/register', { body: { name: 'Arjun Owner', email: 'owner@smoke.test', password: 'password123' } })).json;
  check('owner registers', !!owner.token);

  const biz = (await api('/businesses', { token: owner.token, body: { name: 'Smoke Traders' } })).json;
  const bizId = biz.business?._id;
  check('owner creates business', !!bizId);

  const invite = (await api('/members/invite', { token: owner.token, body: { businessId: bizId, email: 'member@smoke.test', displayName: 'Meena — Sales' } })).json;
  const inviteToken = String(invite.inviteLink || '').split('token=')[1];
  check('invite issued with link', !!inviteToken);

  const member = (await api('/auth/register', { body: { name: 'Meena Member', email: 'member@smoke.test', password: 'password123', inviteToken } })).json;
  check('member registers via invite', !!member.token);

  const memberBiz = (await api('/businesses', { token: member.token })).json;
  check('membership created', memberBiz.businesses?.length === 1 && memberBiz.businesses[0].role === 'MEMBER');

  // tenancy guard: member must NOT see owner endpoints
  const forbidden = await api(`/dashboard/overview?businessId=${bizId}`, { token: member.token });
  check('member blocked from owner dashboard (403)', forbidden.status === 403);

  const outsider = (await api('/auth/register', { body: { name: 'Out Sider', email: 'out@smoke.test', password: 'password123' } })).json;
  const sneaky = await api('/tasks', { token: outsider.token, body: { businessId: bizId, title: 'hack' } });
  check('non-member blocked from creating task in business (403)', sneaky.status === 403);

  console.log('\n— Tasks —');
  const past = new Date(Date.now() - 3600_000).toISOString();
  const task = (await api('/tasks', { token: owner.token, body: { businessId: bizId, assigneeId: member.user._id, title: 'Call 5 leads', priority: 'HIGH', dueAt: past } })).json;
  check('owner assigns overdue task to member', !!task.task?._id);

  const memberTasks = (await api(`/tasks?businessId=all&mine=true`, { token: member.token })).json;
  check('member sees own task + assignment notification', memberTasks.tasks?.length === 1);

  const confirmEarly = await api(`/tasks/${task.task._id}`, { method: 'PATCH', token: owner.token, body: { confirmedByOwner: true } });
  check('confirm before DONE rejected (400)', confirmEarly.status === 400);

  const memberConfirm = await api(`/tasks/${task.task._id}`, { method: 'PATCH', token: member.token, body: { status: 'DONE', confirmedByOwner: true } });
  check('member cannot self-confirm (403)', memberConfirm.status === 403);

  await api(`/tasks/${task.task._id}`, { method: 'PATCH', token: member.token, body: { status: 'DONE' } });
  const confirmed = (await api(`/tasks/${task.task._id}`, { method: 'PATCH', token: owner.token, body: { confirmedByOwner: true } })).json;
  check('member completes, owner confirms', confirmed.task?.confirmedByOwner === true);

  console.log('\n— Time, daily log, follow-ups —');
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
  const entry = (await api('/time', { token: member.token, body: { businessId: bizId, date: today, minutes: 90, note: 'Lead calls', source: 'TIMER' } })).json;
  check('member logs time', !!entry.entry?._id);

  const log = (await api('/daily-logs', { token: member.token, body: { businessId: bizId, date: today, summary: 'Called 5 leads, 2 interested.' } })).json;
  check('member saves daily log (upsert)', !!log.log?._id);

  const fuOverdue = (await api('/followups', { token: member.token, body: { businessId: bizId, clientName: 'Gupta & Sons', dueAt: past, note: 'price list' } })).json;
  const fuToday = (await api('/followups', { token: member.token, body: { businessId: bizId, clientName: 'Khanna Traders', dueAt: new Date(Date.now() + 6 * 3600_000).toISOString() } })).json;
  check('member creates follow-ups', !!fuOverdue.followup && !!fuToday.followup);

  console.log('\n— Automation endpoints (service token) —');
  const noToken = await api('/automation/due-followups');
  check('automation blocked without service token (401)', noToken.status === 401);

  const due = (await api('/automation/due-followups', { service: true })).json;
  check('due-followups lists today\'s pending', due.count >= 1);

  const marked = (await api('/automation/mark-overdue', { method: 'POST', service: true, body: {} })).json;
  check('mark-overdue flips PENDING→OVERDUE with owner contact', marked.markedOverdue === 1 && marked.followups?.[0]?.owner?.email === 'owner@smoke.test');

  // a fresh past-due follow-up exercises the full escalation path (notify member + owner)
  const fuOverdue2 = (await api('/followups', { token: member.token, body: { businessId: bizId, clientName: 'Meridian Imports', dueAt: past } })).json;
  check('second past-due follow-up created', !!fuOverdue2.followup);

  const overdueJob = (await api('/automation/run/followup-overdue', { method: 'POST', service: true, body: {} })).json;
  check('run/followup-overdue marks + escalates', overdueJob.job === 'followup-overdue' && overdueJob.markedOverdue === 1);

  const taskJob = (await api('/automation/run/overdue-tasks', { method: 'POST', service: true, body: {} })).json;
  check('run/overdue-tasks executes (task already DONE → 0 alerts)', taskJob.job === 'overdue-tasks' && taskJob.tasksAlerted === 0);

  const nudge = (await api('/automation/run/daily-nudge', { method: 'POST', service: true, body: {} })).json;
  check('run/daily-nudge skips members who logged today', nudge.membersNudged === 1 /* owner logged nothing */);

  const missing = (await api('/automation/missing-logs', { service: true })).json;
  check('missing-logs excludes the member who logged', missing.members?.every((m: any) => m.userId?.email !== 'member@smoke.test'));

  console.log('\n— Owner dashboard & notifications —');
  const overview = (await api(`/dashboard/overview?businessId=all`, { token: owner.token })).json;
  const meenaCard = overview.members?.find((m: any) => m.email === 'member@smoke.test');
  check('overview member card aggregates correctly', meenaCard?.minutesToday === 90 && meenaCard?.loggedToday === true);
  check('needs-attention strip has the overdue follow-up', overview.needsAttention?.overdueFollowups?.length >= 1);

  const detail = (await api(`/dashboard/member/${member.user._id}?businessId=all`, { token: owner.token })).json;
  check('member detail returns tasks/time/logs/followups', detail.tasks?.length === 1 && detail.timeEntries?.length === 1 && detail.dailyLogs?.length === 1 && detail.followups?.length === 3);

  const notifs = (await api('/notifications', { token: member.token })).json;
  check('member received in-app notifications', notifs.unread >= 2 /* task assigned + overdue followup */);
  await api('/notifications/read', { token: member.token, body: { all: true } });
  const after = (await api('/notifications', { token: member.token })).json;
  check('mark-all-read works', after.unread === 0);

  console.log(`\n${'='.repeat(40)}\nSmoke result: ${passed} passed, ${failed} failed`);
  await mem.stop();
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
