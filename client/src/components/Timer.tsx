import { useEffect, useState } from 'react';
import { useLogTimeMutation } from '../api/endpoints';
import { istToday } from '../lib/dates';
import { Task, refId } from '../types';
import { toast } from './ui';

const TIMER_KEY = 'pulse-timer';

interface TimerState {
  startedAt: number;
  businessId: string;
  taskId?: string;
  taskTitle?: string;
}

export default function Timer({ businessId, tasks }: { businessId: string; tasks: Task[] }) {
  const [running, setRunning] = useState<TimerState | null>(() => {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [taskId, setTaskId] = useState('');
  const [, forceTick] = useState(0);
  const [logTime, { isLoading }] = useLogTimeMutation();

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const start = () => {
    if (businessId === 'all') return;
    const task = tasks.find((t) => t._id === taskId);
    const state: TimerState = {
      startedAt: Date.now(),
      businessId,
      taskId: taskId || undefined,
      taskTitle: task?.title,
    };
    localStorage.setItem(TIMER_KEY, JSON.stringify(state));
    setRunning(state);
  };

  const stop = async () => {
    if (!running) return;
    const minutes = Math.max(1, Math.round((Date.now() - running.startedAt) / 60_000));
    const ok = await logTime({
      businessId: running.businessId,
      taskId: running.taskId,
      date: istToday(),
      minutes,
      note: running.taskTitle ? `Timer: ${running.taskTitle}` : 'Timer session',
      source: 'TIMER',
    })
      .unwrap()
      .catch(() => null);

    localStorage.removeItem(TIMER_KEY);
    setRunning(null);

    if (ok) {
      toast.success(`Logged ${minutes}m via timer`);
    } else {
      toast.error('Failed to save timer — time not logged');
    }
  };

  const elapsed = running ? Math.floor((Date.now() - running.startedAt) / 1000) : 0;
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  if (running) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-900 px-4 py-3 text-white shadow-lg">
        <span className="timer-dot h-2.5 w-2.5 rounded-full bg-warning-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-display text-2xl font-bold tabular-nums leading-none">
            {hh}:{mm}:{ss}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/60">{running.taskTitle || 'General work'}</p>
        </div>
        <button
          onClick={stop}
          disabled={isLoading}
          className="btn-secondary text-sm font-semibold px-3 py-2 flex items-center gap-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-surface-500 animate-bounce" />Saving…</span>
          ) : (
            '■ Stop & save'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={taskId}
        onChange={(e) => setTaskId(e.target.value)}
        className="form-input flex-1 text-sm"
        aria-label="Timer task"
      >
        <option value="">General work (no task)</option>
        {tasks
          .filter((t) => t.status !== 'DONE' && (businessId === 'all' || refId(t.businessId) === businessId))
          .map((t) => (
            <option key={t._id} value={t._id}>{t.title}</option>
          ))}
      </select>
      <button
        onClick={start}
        disabled={businessId === 'all'}
        className="btn btn-primary btn-sm"
        title={businessId === 'all' ? 'Pick a specific business first' : 'Start timer'}
      >
        ▶ Start timer
      </button>
    </div>
  );
}
