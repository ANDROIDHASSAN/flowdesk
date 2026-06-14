import { useParams, Link } from 'react-router-dom';
import { useGetMemberDetailQuery } from '../../api/endpoints';
import { Avatar, Badge, Card, EmptyState, SectionTitle, Spinner } from '../../components/ui';
import { fmtDate, fmtDateTime, fmtMinutes, isPast } from '../../lib/dates';
import { useAppSelector } from '../../store';
import { refName } from '../../types';
import { ArrowLeft, CheckSquare, Clock, MessageSquare, FileText } from 'lucide-react';

const TASK_STATUS_VARIANT = { TODO: 'gray', IN_PROGRESS: 'warning', DONE: 'success' } as const;
const TASK_PRIORITY_VARIANT = { LOW: 'info', MED: 'warning', HIGH: 'danger' } as const;
const FOLLOWUP_VARIANT = { PENDING: 'warning', DONE: 'success', OVERDUE: 'danger' } as const;

export default function MemberDetail() {
  const { userId = '' } = useParams();
  const businessId = useAppSelector((s) => s.ui.businessId);
  const { data, isLoading, error } = useGetMemberDetailQuery(
    { userId, businessId },
    { skip: !userId }
  );

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error || !data) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<CheckSquare size={28} />}
          title="Member not found"
          description="They may not belong to the selected business."
          action={<Link to="/dashboard" className="btn btn-secondary btn-sm">Back to Dashboard</Link>}
        />
      </div>
    );
  }

  const { user, memberships, tasks, timeEntries, dailyLogs, followups } = data;
  const openTasks = tasks.filter((t) => t.status !== 'DONE');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');
  const openFu = followups.filter((f) => f.status !== 'DONE');
  const totalMinutes = timeEntries.reduce((s, e) => s + e.minutes, 0);

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="w-8 h-8 rounded-lg border border-surface-200 flex items-center justify-center hover:bg-surface-50 transition-colors"
          >
            <ArrowLeft size={14} className="text-surface-500" />
          </Link>
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size="md" />
            <div>
              <h1 className="text-lg font-display font-bold text-surface-900">{user.name}</h1>
              <p className="text-sm text-surface-400">
                {user.email}
                {memberships.length > 0 && ` · ${memberships.map((m) => `${m.businessId.name} (${m.displayName})`).join(', ')}`}
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <div className="bg-success-50 border border-success-200 rounded-xl px-3 py-1.5 text-center">
              <p className="text-sm font-bold text-success-700">{fmtMinutes(totalMinutes)}</p>
              <p className="text-[10px] text-success-500">Last 14 days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 grid gap-6 lg:grid-cols-2">
        {/* Tasks */}
        <section>
          <SectionTitle
            title={`Tasks (${openTasks.length} open)`}
            subtitle="Assigned work"
            className="mb-3"
          />
          <div className="space-y-2">
            {openTasks.length === 0 && (
              <EmptyState icon={<CheckSquare size={20} />} title="No open tasks" />
            )}
            {openTasks.map((t) => (
              <Card key={t._id} padding="sm" accent={isPast(t.dueAt) ? 'danger' : undefined}>
                <p className="font-semibold text-surface-900 text-sm">{t.title}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                  <Badge variant={TASK_STATUS_VARIANT[t.status]} size="xs">{t.status.replace('_', ' ')}</Badge>
                  <Badge variant={TASK_PRIORITY_VARIANT[t.priority]} size="xs">{t.priority}</Badge>
                  {refName(t.businessId) && <span className="text-xs text-surface-400">{refName(t.businessId)}</span>}
                  {t.dueAt && (
                    <span className={`text-xs ${isPast(t.dueAt) ? 'font-bold text-danger-600' : 'text-surface-400'}`}>
                      Due {fmtDateTime(t.dueAt)}
                    </span>
                  )}
                </div>
              </Card>
            ))}
            {doneTasks.slice(0, 5).map((t) => (
              <div key={t._id} className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 text-sm">
                <span className="text-success-500">✓</span>
                <span className="text-surface-500 truncate">{t.title}</span>
                {t.confirmedByOwner && <Badge variant="success" size="xs">Confirmed</Badge>}
              </div>
            ))}
          </div>
        </section>

        {/* Follow-ups */}
        <section>
          <SectionTitle
            title={`Follow-ups (${openFu.length} open)`}
            subtitle="Client callbacks"
            className="mb-3"
          />
          <div className="space-y-2">
            {openFu.length === 0 && (
              <EmptyState icon={<MessageSquare size={20} />} title="No open follow-ups" />
            )}
            {openFu.map((f) => {
              const isOverdue = f.status === 'OVERDUE' || isPast(f.dueAt);
              return (
                <Card key={f._id} padding="sm" accent={isOverdue ? 'danger' : undefined}>
                  <p className="font-semibold text-surface-900 text-sm">{f.clientName}</p>
                  {f.note && <p className="text-xs text-surface-500 mt-0.5 truncate">{f.note}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                    <Badge variant={FOLLOWUP_VARIANT[isOverdue ? 'OVERDUE' : 'PENDING']} size="xs">
                      {isOverdue ? 'Overdue' : 'Pending'}
                    </Badge>
                    {refName(f.businessId) && <span className="text-xs text-surface-400">{refName(f.businessId)}</span>}
                    <span className={`text-xs ${isOverdue ? 'font-bold text-danger-600' : 'text-surface-400'}`}>
                      Due {fmtDateTime(f.dueAt)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Time entries */}
        <section>
          <SectionTitle title="Time Entries" subtitle="Last 14 days" className="mb-3" />
          <Card padding="none">
            {timeEntries.length === 0 && (
              <p className="p-4 text-sm text-surface-400">No time logged in the last 14 days.</p>
            )}
            {timeEntries.slice(0, 20).map((e) => (
              <div key={e._id} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-100 last:border-0">
                <div className="min-w-0 flex items-center gap-2">
                  <div className="w-7 h-7 bg-info-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={12} className="text-info-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900">{fmtDate(e.date)}</p>
                    <p className="text-xs text-surface-400 truncate">{e.note || (typeof e.taskId === 'object' && e.taskId?.title) || 'Work session'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={e.source === 'TIMER' ? 'brand' : 'gray'} size="xs">{e.source}</Badge>
                  <span className="font-display font-bold text-surface-900 text-sm">{fmtMinutes(e.minutes)}</span>
                </div>
              </div>
            ))}
          </Card>
        </section>

        {/* Daily logs */}
        <section>
          <SectionTitle title="Daily Logs" subtitle="End-of-day summaries" className="mb-3" />
          <div className="space-y-2">
            {dailyLogs.length === 0 && (
              <EmptyState icon={<FileText size={20} />} title="No daily logs yet" />
            )}
            {dailyLogs.map((l) => (
              <Card key={l._id} padding="sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-brand-50 rounded-md flex items-center justify-center">
                    <FileText size={11} className="text-brand-600" />
                  </div>
                  <p className="text-xs font-bold text-brand-600">{fmtDate(l.date)} · {refName(l.businessId)}</p>
                </div>
                <p className="text-sm text-surface-700 leading-relaxed">{l.summary}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
