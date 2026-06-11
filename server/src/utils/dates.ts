/**
 * All "calendar day" logic runs in IST (Asia/Kolkata, UTC+5:30, no DST) since the
 * product targets India-based teams. Days are stored as YYYY-MM-DD strings.
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Today's date in IST as YYYY-MM-DD */
export function istToday(): string {
  return istDateOf(new Date());
}

/** The IST calendar day a given instant falls on */
export function istDateOf(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** UTC instant at which the given IST day starts (00:00 IST) */
export function istDayStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000+05:30`);
}

/** UTC instant at which the given IST day ends (exclusive) */
export function istDayEnd(dateStr: string): Date {
  return new Date(istDayStart(dateStr).getTime() + 24 * 60 * 60 * 1000);
}

/** Monday of the current IST week, as YYYY-MM-DD */
export function istWeekStart(): string {
  const nowIst = new Date(Date.now() + IST_OFFSET_MS);
  const day = nowIst.getUTCDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1;
  nowIst.setUTCDate(nowIst.getUTCDate() - diff);
  return nowIst.toISOString().slice(0, 10);
}

/** Shift a YYYY-MM-DD string by n days */
export function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Human-friendly IST date-time, used in emails/notifications */
export function formatIst(d: Date): string {
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
}
