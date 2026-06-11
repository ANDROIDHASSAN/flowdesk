/** IST-aware date helpers mirrored from the server */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function istToday(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function fmtMinutes(min: number): string {
  if (!min) return '0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m ? `${m}m` : ''}`.trim() : `${m}m`;
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function fmtDate(iso?: string): string {
  if (!iso) return '—';
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' });
}

export function isPast(iso?: string): boolean {
  return !!iso && new Date(iso).getTime() < Date.now();
}

/** "in 3h" / "2d ago" style relative label */
export function relativeDue(iso?: string): string {
  if (!iso) return '';
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const hours = Math.round(abs / 3600_000);
  const days = Math.round(abs / 86400_000);
  const label = hours < 1 ? 'now' : hours < 24 ? `${hours}h` : `${days}d`;
  return diff >= 0 ? `in ${label}` : `${label} late`;
}

/** local datetime-input value for "tomorrow 10am" style defaults */
export function defaultDueInput(hoursAhead = 24): string {
  const d = new Date(Date.now() + hoursAhead * 3600_000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
