import cron from 'node-cron';
import { JOBS } from './services/jobs';

/**
 * Fallback scheduler (ENABLE_INTERNAL_CRON=true) for when n8n isn't running.
 * Mirrors the recommended n8n schedules — all in IST.
 */
export function startInternalCron(): void {
  const tz = { timezone: 'Asia/Kolkata' };

  const run = (name: string) => async () => {
    try {
      const result = await JOBS[name]();
      console.log(`[cron] ${name}`, JSON.stringify(result));
    } catch (err) {
      console.error(`[cron] ${name} failed`, err);
    }
  };

  cron.schedule('0 9 * * *', run('followup-due'), tz); //  9:00 IST — morning reminders
  cron.schedule('15 9 * * *', run('followup-overdue'), tz); //  9:15 IST — overdue escalation
  cron.schedule('0 * * * *', run('overdue-tasks'), tz); //  hourly  — overdue task alerts
  cron.schedule('30 19 * * *', run('daily-nudge'), tz); // 19:30 IST — evening logging nudge

  console.log('[cron] internal scheduler enabled (IST)');
}
