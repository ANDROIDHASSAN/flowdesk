import { useEffect, useRef, useState } from 'react';
import { useGetNotificationsQuery, useMarkNotificationsReadMutation } from '../api/endpoints';
import { fmtDateTime } from '../lib/dates';
import { refName } from '../types';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useGetNotificationsQuery(undefined, { pollingInterval: 30_000 });
  const [markRead] = useMarkNotificationsReadMutation();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unread = data?.unread || 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full border border-surface-200 bg-white p-2 text-surface-500 transition hover:border-surface-300 hover:text-surface-700"
        aria-label={`Notifications (${unread} unread)`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1 font-display text-[11px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 z-40 mt-2 max-h-[70vh] w-[min(92vw,380px)] overflow-y-auto rounded-xl border border-surface-200 bg-white shadow-xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-surface-100 bg-white px-4 py-3">
            <p className="font-display font-bold text-surface-900">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => markRead({ all: true })}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                Mark all read ✓
              </button>
            )}
          </div>
          {!data?.items.length ? (
            <p className="px-4 py-8 text-center text-sm text-surface-400">All caught up — no notifications yet.</p>
          ) : (
            data.items.map((n) => (
              <div
                key={n._id}
                className={`border-b border-surface-50 px-4 py-3 transition-colors hover:bg-surface-50 ${n.read ? 'opacity-60' : 'bg-brand-50/40'}`}
              >
                <p className="text-sm leading-snug text-surface-800">{n.message}</p>
                <p className="mt-1 text-[11px] font-semibold text-surface-400">
                  {refName(n.businessId as { _id: string; name: string })} · {fmtDateTime(n.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
