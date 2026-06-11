import { useMemo } from 'react';
import { useGetFollowUpsQuery, useUpdateFollowUpMutation } from '../../api/endpoints';
import { Badge, Button, Card, EmptyState, SectionTitle, Spinner } from '../../components/ui';
import { fmtDateTime, isPast, relativeDue } from '../../lib/dates';
import { useAppSelector } from '../../store';
import { FollowUp, FollowUpStatus, refName } from '../../types';
import { Target, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

const GROUPS: { key: FollowUpStatus; title: string; subtitle: string; bgColor: string; borderColor: string; icon: React.ReactNode; badgeVariant: 'danger' | 'warning' | 'success' }[] = [
  {
    key: 'OVERDUE',
    title: 'Overdue',
    subtitle: 'Needs immediate attention',
    bgColor: 'bg-danger-50/50',
    borderColor: 'border-danger-200',
    icon: <AlertCircle size={16} className="text-danger-600" />,
    badgeVariant: 'danger',
  },
  {
    key: 'PENDING',
    title: 'Pending',
    subtitle: 'Upcoming callbacks',
    bgColor: 'bg-warning-50/50',
    borderColor: 'border-warning-200',
    icon: <Clock size={16} className="text-warning-600" />,
    badgeVariant: 'warning',
  },
  {
    key: 'DONE',
    title: 'Closed',
    subtitle: 'Completed follow-ups',
    bgColor: 'bg-success-50/50',
    borderColor: 'border-success-200',
    icon: <CheckCircle2 size={16} className="text-success-600" />,
    badgeVariant: 'success',
  },
];

export default function Pipeline() {
  const businessId = useAppSelector((s) => s.ui.businessId);
  const { data, isLoading, error } = useGetFollowUpsQuery({ businessId });
  const [updateFollowUp] = useUpdateFollowUpMutation();

  const grouped = useMemo(() => {
    const all = data?.followups || [];
    const effective = (f: FollowUp): FollowUpStatus =>
      f.status === 'PENDING' && isPast(f.dueAt) ? 'OVERDUE' : f.status;
    return GROUPS.map((g) => ({
      ...g,
      items: all.filter((f) => effective(f) === g.key).slice(0, g.key === 'DONE' ? 15 : 100),
    }));
  }, [data]);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Target size={28} />}
          title="Pipeline is for owners only"
          description="Members can see their own follow-ups under 'My Follow-ups'."
        />
      </div>
    );
  }

  const totalCount = grouped.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-success-50 rounded-xl flex items-center justify-center">
              <Target size={18} className="text-success-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-surface-900">Follow-up Pipeline</h1>
              <p className="text-sm text-surface-500">All client callbacks — {totalCount} total</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {grouped.map((g) => (
              <div key={g.key} className="hidden sm:flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${g.key === 'OVERDUE' ? 'bg-danger-400' : g.key === 'PENDING' ? 'bg-warning-400' : 'bg-success-400'}`} />
                <span className="text-xs font-medium text-surface-600">{g.items.length} {g.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {grouped.map((g) => (
            <div key={g.key} className={`rounded-2xl border-2 ${g.bgColor} ${g.borderColor} p-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {g.icon}
                  <div>
                    <h3 className="font-display text-sm font-bold text-surface-800">{g.title}</h3>
                    <p className="text-[10px] text-surface-400">{g.subtitle}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-surface-500 bg-white/80 px-2 py-0.5 rounded-full">
                  {g.items.length}
                </span>
              </div>

              <div className="space-y-2">
                {g.items.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-surface-400">No items</p>
                  </div>
                ) : (
                  g.items.map((f) => (
                    <div key={f._id} className="bg-white rounded-xl p-3.5 shadow-sm border border-surface-100">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm text-surface-900 leading-snug">{f.clientName}</p>
                        <Badge variant={g.badgeVariant} size="xs">{g.key}</Badge>
                      </div>
                      {f.note && (
                        <p className="text-xs text-surface-500 mb-2 leading-relaxed line-clamp-2">{f.note}</p>
                      )}
                      {f.outcome && (
                        <p className="text-xs text-success-600 mb-2 font-medium">→ {f.outcome}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-surface-400">
                        <div>
                          <span className="font-medium text-surface-600">{refName(f.userId)}</span>
                          {businessId === 'all' && f.businessId && <span className="ml-1">· {refName(f.businessId)}</span>}
                        </div>
                      </div>
                      <p className={`text-xs mt-1 ${g.key === 'OVERDUE' ? 'font-bold text-danger-600' : 'text-surface-400'}`}>
                        {fmtDateTime(f.dueAt)} · {relativeDue(f.dueAt)}
                      </p>
                      {g.key !== 'DONE' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => updateFollowUp({ id: f._id, status: 'DONE' })}
                          className="mt-2 w-full"
                        >
                          ✓ Mark Done
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
