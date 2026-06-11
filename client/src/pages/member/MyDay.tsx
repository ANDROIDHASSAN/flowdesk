import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  useGetBusinessesQuery,
  useGetDailyLogsQuery,
  useGetTasksQuery,
  useGetTimeEntriesQuery,
  useLogTimeMutation,
  useSaveDailyLogMutation,
  useUpdateTaskMutation,
  useCreateTaskMutation,
} from '../../api/endpoints';
import Timer from '../../components/Timer';
import { Badge, Button, Card, EmptyState, Input, Modal, SectionTitle, Spinner, toast } from '../../components/ui';
import { fmtMinutes, fmtDateTime, istToday, isPast, relativeDue } from '../../lib/dates';
import { useAppSelector } from '../../store';
import { refId, refName, TaskStatus } from '../../types';
import { Sun, Clock, CheckSquare, Plus, FileText, Zap } from 'lucide-react';

const NEXT_STATUS: Record<TaskStatus, { to: TaskStatus; label: string } | null> = {
  TODO: { to: 'IN_PROGRESS', label: '▶ Start' },
  IN_PROGRESS: { to: 'DONE', label: '✓ Done' },
  DONE: null,
};

const TASK_STATUS_VARIANT = { TODO: 'gray', IN_PROGRESS: 'warning', DONE: 'success' } as const;
const TASK_PRIORITY_VARIANT = { LOW: 'info', MED: 'warning', HIGH: 'danger' } as const;

const DAY_STEPS = [
  {
    key: 'time',
    icon: Clock,
    label: 'Time Logged',
    doneClasses: 'border-brand-200 bg-brand-50',
    iconDone: 'bg-brand-100',
    iconColor: 'text-brand-600',
    labelDone: 'text-brand-700',
    valueDone: 'text-brand-800',
  },
  {
    key: 'tasks',
    icon: CheckSquare,
    label: 'Tasks Done',
    doneClasses: 'border-success-200 bg-success-50',
    iconDone: 'bg-success-100',
    iconColor: 'text-success-600',
    labelDone: 'text-success-700',
    valueDone: 'text-success-800',
  },
  {
    key: 'summary',
    icon: FileText,
    label: 'Day Summary',
    doneClasses: 'border-purple-200 bg-purple-50',
    iconDone: 'bg-purple-100',
    iconColor: 'text-purple-600',
    labelDone: 'text-purple-700',
    valueDone: 'text-purple-800',
  },
] as const;

export default function MyDay() {
  const businessId = useAppSelector((s) => s.ui.businessId);
  const today = istToday();

  const { data: bizData } = useGetBusinessesQuery();
  const { data: taskData, isLoading } = useGetTasksQuery({ businessId, mine: true });
  const { data: timeData } = useGetTimeEntriesQuery({ businessId, from: today, to: today });
  const { data: logData } = useGetDailyLogsQuery({ businessId, from: today, to: today });

  const [updateTask] = useUpdateTaskMutation();
  const [logTime, timeResult] = useLogTimeMutation();
  const [saveLog, logResult] = useSaveDailyLogMutation();
  const [createTask, createResult] = useCreateTaskMutation();

  const myBusinesses = bizData?.businesses || [];
  const singleBusinessId = businessId !== 'all' ? businessId : myBusinesses.length === 1 ? myBusinesses[0].business._id : '';

  const [minutes, setMinutes] = useState('');
  const [note, setNote] = useState('');
  const [timeBiz, setTimeBiz] = useState('');
  const [summary, setSummary] = useState('');
  const [logBiz, setLogBiz] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newBiz, setNewBiz] = useState('');

  const tasks = taskData?.tasks || [];
  const open = tasks.filter((t) => t.status !== 'DONE');
  const doneToday = tasks.filter((t) => t.status === 'DONE' && t.completedAt && t.completedAt.slice(0, 10) === today.slice(0, 10));
  const minutesToday = useMemo(() => (timeData?.entries || []).reduce((s, e) => s + e.minutes, 0), [timeData]);
  const existingLog = (logData?.logs || []).find((l) => l.date === today && (businessId === 'all' || refId(l.businessId) === businessId));

  // Pre-fill summary textarea when an existing log is loaded (it arrives async)
  useEffect(() => {
    if (existingLog?.summary) {
      setSummary((prev) => prev || existingLog.summary);
    }
  }, [existingLog?._id, existingLog?.summary]);

  const focusTask = open.find((t) => t.status === 'IN_PROGRESS');
  const hasLoggedTime = minutesToday > 0;
  const hasCompletedTask = doneToday.length > 0;
  const hasSavedSummary = !!existingLog;

  const dayStepValues = {
    time: hasLoggedTime ? fmtMinutes(minutesToday) : 'Not yet',
    tasks: hasCompletedTask ? `${doneToday.length} completed` : open.length > 0 ? `${open.length} open` : 'None yet',
    summary: hasSavedSummary ? 'Saved ✓' : 'Pending',
  };
  const dayStepDone = { time: hasLoggedTime, tasks: hasCompletedTask, summary: hasSavedSummary };

  const BizSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    if (singleBusinessId) return null;
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-surface-700">Business</label>
        <select className="form-input" value={value} onChange={(e) => onChange(e.target.value)} required>
          <option value="">Choose business…</option>
          {myBusinesses.map((b) => (
            <option key={b.business._id} value={b.business._id}>{b.business.name}</option>
          ))}
        </select>
      </div>
    );
  };

  const submitTime = async (e: FormEvent) => {
    e.preventDefault();
    const biz = singleBusinessId || timeBiz;
    if (!biz || !minutes) return;
    const ok = await logTime({ businessId: biz, date: today, minutes: Number(minutes), note }).unwrap().catch(() => null);
    if (ok) {
      setMinutes(''); setNote('');
      toast.success(`${minutes} minutes logged successfully`);
    } else {
      toast.error('Failed to log time — please try again');
    }
  };

  const submitLog = async (e: FormEvent) => {
    e.preventDefault();
    const biz = singleBusinessId || logBiz;
    if (!biz || !summary.trim()) return;
    const ok = await saveLog({ businessId: biz, date: today, summary }).unwrap().catch(() => null);
    if (ok) toast.success('Day summary saved');
    else toast.error('Failed to save summary');
  };

  const submitTask = async (e: FormEvent) => {
    e.preventDefault();
    const biz = singleBusinessId || newBiz;
    if (!biz || !newTitle.trim()) return;
    const ok = await createTask({ businessId: biz, title: newTitle, dueAt: newDue || undefined }).unwrap().catch(() => null);
    if (ok) {
      setNewTitle(''); setNewDue(''); setShowAdd(false);
      toast.success('Task added');
    } else {
      toast.error('Failed to create task');
    }
  };

  const autoFillSummary = () => {
    const parts: string[] = [];
    if (doneToday.length > 0) parts.push(...doneToday.map((t) => `• Completed: ${t.title}`));
    if (minutesToday > 0) parts.push(`• Logged ${fmtMinutes(minutesToday)} of work`);
    if (parts.length > 0) setSummary(parts.join('\n'));
  };

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-warning-50 rounded-xl flex items-center justify-center">
              <Sun size={18} className="text-warning-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-surface-900">My Day</h1>
              <p className="text-sm text-surface-500">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-lg font-display font-bold text-brand-600">{fmtMinutes(minutesToday)}</span>
              <span className="text-xs text-surface-400">logged today</span>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className={`text-lg font-display font-bold ${open.some((t) => isPast(t.dueAt)) ? 'text-danger-600' : 'text-surface-800'}`}>{open.length}</span>
              <span className="text-xs text-surface-400">open tasks</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Day Progress */}
        <div className="grid grid-cols-3 gap-3">
          {DAY_STEPS.map((step) => {
            const done = dayStepDone[step.key];
            const value = dayStepValues[step.key];
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className={`rounded-xl border p-3 transition-all ${done ? step.doneClasses : 'border-surface-200 bg-white'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${done ? step.iconDone : 'bg-surface-100'}`}>
                    <Icon size={13} className={done ? step.iconColor : 'text-surface-400'} />
                  </div>
                  <span className={`text-xs font-semibold ${done ? step.labelDone : 'text-surface-500'}`}>{step.label}</span>
                </div>
                <p className={`text-sm font-bold ${done ? step.valueDone : 'text-surface-400'}`}>{value}</p>
              </div>
            );
          })}
        </div>

        {/* Focus task */}
        {focusTask && (
          <div className="rounded-xl border-2 border-brand-300 bg-brand-50 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-brand-500 uppercase tracking-wide mb-0.5">Currently Working On</p>
              <p className="font-semibold text-brand-900 truncate">{focusTask.title}</p>
            </div>
            <Button variant="success" size="sm" onClick={() => updateTask({ id: focusTask._id, status: 'DONE' })}>
              ✓ Mark Done
            </Button>
          </div>
        )}

        {/* Timer + Manual log */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
              <Clock size={16} className="text-brand-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">Time Logging</h3>
              <p className="text-xs text-surface-400">Track your hours with timer or manually</p>
            </div>
          </div>
          <Timer businessId={singleBusinessId || businessId} tasks={tasks} />
          <form onSubmit={submitTime} className="mt-4 pt-4 border-t border-surface-100 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BizSelect value={timeBiz} onChange={setTimeBiz} />
            <Input
              label="Minutes"
              type="number"
              min={1}
              max={1440}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="e.g. 90"
              required
            />
            <Input
              label="What you worked on"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
            />
            <div className="flex items-end">
              <Button variant="secondary" type="submit" disabled={timeResult.isLoading} className="w-full">
                {timeResult.isLoading ? 'Saving...' : 'Log Hours'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Tasks */}
        <section>
          <SectionTitle
            title="Today's Tasks"
            subtitle="Your assignments"
            action={
              <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
                Add Task
              </Button>
            }
            className="mb-3"
          />
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : open.length === 0 ? (
            <EmptyState
              icon={<CheckSquare size={24} />}
              title="No open tasks"
              description="Add your own task or wait for the owner to assign one."
              action={<Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Add Task</Button>}
            />
          ) : (
            <div className="space-y-2">
              {open
                .slice()
                .sort((a, b) => {
                  if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
                  if (b.status === 'IN_PROGRESS' && a.status !== 'IN_PROGRESS') return 1;
                  return (a.dueAt || '9999').localeCompare(b.dueAt || '9999');
                })
                .map((t) => {
                  const overdue = isPast(t.dueAt);
                  const isFocus = t._id === focusTask?._id;
                  const next = NEXT_STATUS[t.status];
                  return (
                    <div
                      key={t._id}
                      className={`card flex items-center gap-3 p-3.5 transition-all ${isFocus ? 'ring-2 ring-brand-300' : ''} ${overdue ? 'border-danger-200 bg-danger-50/30' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-surface-900 text-sm truncate">{t.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant={TASK_STATUS_VARIANT[t.status]} size="xs">{t.status.replace('_', ' ')}</Badge>
                          <Badge variant={TASK_PRIORITY_VARIANT[t.priority]} size="xs">{t.priority}</Badge>
                          {refName(t.businessId) && <span className="text-xs text-surface-400">{refName(t.businessId)}</span>}
                          {t.dueAt && (
                            <span className={`text-xs ${overdue ? 'font-bold text-danger-600' : 'text-surface-400'}`}>
                              Due {fmtDateTime(t.dueAt)} ({relativeDue(t.dueAt)})
                            </span>
                          )}
                        </div>
                      </div>
                      {next && (
                        <Button
                          variant={next.to === 'DONE' ? 'success' : 'secondary'}
                          size="sm"
                          onClick={() => updateTask({ id: t._id, status: next.to })}
                        >
                          {next.label}
                        </Button>
                      )}
                    </div>
                  );
                })}
              {doneToday.length > 0 && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-success-50 border border-success-200">
                  <p className="text-sm font-bold text-success-700 mb-1.5">
                    🎉 {doneToday.length} task{doneToday.length > 1 ? 's' : ''} finished today — great work!
                  </p>
                  <ul className="space-y-0.5">
                    {doneToday.map((t) => (
                      <li key={t._id} className="text-xs text-success-600">✓ {t.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* End of day log */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">End of Day Summary</h3>
              <p className="text-xs text-surface-400">Share what you accomplished today</p>
            </div>
          </div>
          {existingLog && (
            <div className="mb-3 rounded-xl bg-success-50 border border-success-200 px-3 py-2.5">
              <p className="text-xs font-bold text-success-600 mb-1">Today's saved summary:</p>
              <p className="text-sm text-success-800">{existingLog.summary}</p>
            </div>
          )}
          <form onSubmit={submitLog} className="space-y-3">
            <BizSelect value={logBiz} onChange={setLogBiz} />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-surface-700">What did you accomplish today?</label>
                {(doneToday.length > 0 || minutesToday > 0) && !summary && (
                  <button
                    type="button"
                    onClick={autoFillSummary}
                    className="text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors"
                  >
                    ✨ Auto-fill from today's work
                  </button>
                )}
              </div>
              <textarea
                className="form-input min-h-[88px] resize-none"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Finished landing page, 2 client calls, proposal sent"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="primary" type="submit" disabled={logResult.isLoading}>
                {logResult.isLoading ? 'Saving...' : existingLog ? 'Update Log' : 'Save Day Log'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Add task modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add a Task" size="md">
        <form onSubmit={submitTask} className="space-y-4">
          {!singleBusinessId && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700">Business</label>
              <select className="form-input" value={newBiz} onChange={(e) => setNewBiz(e.target.value)} required>
                <option value="">Select business…</option>
                {myBusinesses.map((b) => (
                  <option key={b.business._id} value={b.business._id}>{b.business.name}</option>
                ))}
              </select>
            </div>
          )}
          <Input
            label="Task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Prepare client report"
            required
          />
          <Input
            label="Due date (optional)"
            type="datetime-local"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={createResult.isLoading}>
              {createResult.isLoading ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
