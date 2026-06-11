import { FormEvent, useState } from 'react';
import {
  useCreateFollowUpMutation,
  useGetBusinessesQuery,
  useGetFollowUpsQuery,
  useUpdateFollowUpMutation,
} from '../../api/endpoints';
import { Badge, Button, Card, EmptyState, Input, Modal, SectionTitle, Spinner, Textarea, toast } from '../../components/ui';
import { defaultDueInput, fmtDateTime, isPast, relativeDue } from '../../lib/dates';
import { useAppSelector } from '../../store';
import { FollowUp, refName } from '../../types';
import { MessageSquare, Plus, CheckCircle2, Clock } from 'lucide-react';

export default function MyFollowUps() {
  const businessId = useAppSelector((s) => s.ui.businessId);
  const { data, isLoading } = useGetFollowUpsQuery({ businessId, mine: true });
  const { data: bizData } = useGetBusinessesQuery();
  const [createFollowUp, createResult] = useCreateFollowUpMutation();
  const [updateFollowUp] = useUpdateFollowUpMutation();

  const [showAdd, setShowAdd] = useState(false);
  const [closing, setClosing] = useState<FollowUp | null>(null);
  const [outcome, setOutcome] = useState('');
  const [form, setForm] = useState({ businessId: '', clientName: '', contact: '', note: '', dueAt: defaultDueInput() });

  const myBusinesses = bizData?.businesses || [];
  const singleBusinessId = businessId !== 'all' ? businessId : myBusinesses.length === 1 ? myBusinesses[0].business._id : '';

  const followups = data?.followups || [];
  const open = followups.filter((f) => f.status !== 'DONE');
  const closed = followups.filter((f) => f.status === 'DONE').slice(0, 10);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const biz = singleBusinessId || form.businessId;
    if (!biz) return;
    const ok = await createFollowUp({
      businessId: biz,
      clientName: form.clientName,
      contact: form.contact || undefined,
      note: form.note || undefined,
      dueAt: new Date(form.dueAt).toISOString(),
    }).unwrap().catch(() => null);
    if (ok) {
      setForm({ businessId: '', clientName: '', contact: '', note: '', dueAt: defaultDueInput() });
      setShowAdd(false);
      toast.success('Follow-up saved');
    } else {
      toast.error('Failed to create follow-up');
    }
  };

  const markDone = async (e: FormEvent) => {
    e.preventDefault();
    if (!closing) return;
    const ok = await updateFollowUp({ id: closing._id, status: 'DONE', outcome }).unwrap().catch(() => null);
    if (ok) toast.success(`Follow-up with ${closing.clientName} marked done`);
    else toast.error('Failed to close follow-up');
    setClosing(null);
    setOutcome('');
  };

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-success-50 rounded-xl flex items-center justify-center">
              <MessageSquare size={18} className="text-success-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-surface-900">My Follow-ups</h1>
              <p className="text-sm text-surface-500">Client callbacks & reminders</p>
            </div>
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
            New Follow-up
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-display font-bold text-warning-600">{open.filter(f => f.status === 'PENDING' && !isPast(f.dueAt)).length}</p>
            <p className="text-xs text-surface-400 mt-1">Pending</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-display font-bold text-danger-600">{open.filter(f => f.status === 'OVERDUE' || isPast(f.dueAt)).length}</p>
            <p className="text-xs text-surface-400 mt-1">Overdue</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-display font-bold text-success-600">{closed.length}</p>
            <p className="text-xs text-surface-400 mt-1">Closed</p>
          </div>
        </div>

        {/* Open follow-ups */}
        <section>
          <SectionTitle title="Open Follow-ups" subtitle={`${open.length} pending callbacks`} className="mb-3" />
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : open.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={24} />}
              title="No pending follow-ups"
              description="Add one whenever you promise a client a callback."
              action={<Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Add Follow-up</Button>}
            />
          ) : (
            <div className="space-y-2">
              {open.map((f) => {
                const late = f.status === 'OVERDUE' || isPast(f.dueAt);
                return (
                  <div key={f._id} className={`card flex items-center gap-3 p-4 ${late ? 'border-danger-200 bg-danger-50/30' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-surface-900 text-sm">{f.clientName}</p>
                        {f.contact && <span className="text-xs font-medium text-surface-400">{f.contact}</span>}
                      </div>
                      {f.note && <p className="mt-0.5 text-xs text-surface-500 truncate">{f.note}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant={late ? 'danger' : 'warning'} size="xs">{late ? 'Overdue' : 'Pending'}</Badge>
                        {refName(f.businessId) && <span className="text-xs text-surface-400">{refName(f.businessId)}</span>}
                        <span className={`text-xs ${late ? 'font-bold text-danger-600' : 'text-surface-400'}`}>
                          {fmtDateTime(f.dueAt)} · {relativeDue(f.dueAt)}
                        </span>
                      </div>
                    </div>
                    <Button variant="success" size="sm" onClick={() => setClosing(f)}>
                      ✓ Done
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Closed */}
        {closed.length > 0 && (
          <section>
            <SectionTitle title="Recently Closed" subtitle="Completed callbacks" className="mb-3" />
            <div className="space-y-1.5">
              {closed.map((f) => (
                <div key={f._id} className="flex items-center gap-3 rounded-xl bg-surface-50 border border-surface-100 px-3 py-2.5">
                  <CheckCircle2 size={14} className="text-success-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-surface-700">{f.clientName}</span>
                    {f.outcome && <span className="text-sm text-surface-400"> — {f.outcome}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* New follow-up modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Follow-up" size="md">
        <form onSubmit={submit} className="space-y-4">
          {!singleBusinessId && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700">Business</label>
              <select
                className="form-input"
                value={form.businessId}
                onChange={(e) => setForm({ ...form, businessId: e.target.value })}
                required
              >
                <option value="">Select business…</option>
                {myBusinesses.map((b) => (
                  <option key={b.business._id} value={b.business._id}>{b.business.name}</option>
                ))}
              </select>
            </div>
          )}
          <Input
            label="Client name"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            placeholder="e.g. Khanna Jewellers"
            required
          />
          <Input
            label="Contact (phone / email, optional)"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="+91 9876543210"
          />
          <Textarea
            label="Details (optional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="What's this follow-up about?"
          />
          <Input
            label="Due date & time"
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={createResult.isLoading}>
              {createResult.isLoading ? 'Saving...' : 'Save Follow-up'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Close with outcome modal */}
      <Modal open={!!closing} onClose={() => setClosing(null)} title={`Close: ${closing?.clientName || ''}`} size="sm">
        <form onSubmit={markDone} className="space-y-4">
          <Textarea
            label="What was the outcome?"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g. Client agreed to phase-2, advance coming next week"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setClosing(null)}>Cancel</Button>
            <Button variant="success" type="submit">Mark Done</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
