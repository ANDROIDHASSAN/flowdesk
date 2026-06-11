import { FormEvent, useState } from 'react';
import {
  useGetBusinessesQuery,
  useGetBusinessMembersQuery,
  useGetInvitesQuery,
  useInviteMemberMutation,
  useRemoveMemberMutation,
} from '../../api/endpoints';
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, Input, SectionTitle, Spinner, toast } from '../../components/ui';
import { useAppSelector } from '../../store';
import { Users, UserPlus, Mail, Clock, Trash2, Copy } from 'lucide-react';

export default function Members() {
  const globalBizId = useAppSelector((s) => s.ui.businessId);
  const { data: bizData } = useGetBusinessesQuery();
  const owned = (bizData?.businesses || []).filter((b) => b.role === 'OWNER');

  const [selected, setSelected] = useState('');
  const businessId = selected || (globalBizId !== 'all' && owned.some((b) => b.business._id === globalBizId) ? globalBizId : owned[0]?.business._id || '');

  const { data: memberData, isLoading } = useGetBusinessMembersQuery(businessId, { skip: !businessId });
  const { data: inviteData } = useGetInvitesQuery(businessId, { skip: !businessId });
  const [inviteMember, inviteResult] = useInviteMemberMutation();
  const [removeMember, removeResult] = useRemoveMemberMutation();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  if (owned.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Users size={28} />}
          title="No businesses found"
          description="Create a business from the switcher above to manage a team."
        />
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!businessId || !email.trim()) return;
    setInviteLink('');
    const result = await inviteMember({ businessId, email, displayName: displayName || undefined }).unwrap().catch(() => null);
    if (result) {
      toast.success(result.message || 'Invite sent');
      setEmail('');
      setDisplayName('');
      if (result.inviteLink) setInviteLink(result.inviteLink);
    } else {
      toast.error((inviteResult.error as { data?: { message?: string } })?.data?.message || 'Failed to send invite');
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    const ok = await removeMember(removeTarget.id).unwrap().catch(() => null);
    if (ok) toast.success(`${removeTarget.name} removed from team`);
    else toast.error('Failed to remove member');
    setRemoveTarget(null);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => toast.success('Invite link copied!')).catch(() => toast.error('Could not copy link'));
  };

  const members = memberData?.members || [];
  const invites = inviteData?.invites || [];

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-surface-900">Team</h1>
              <p className="text-sm text-surface-500">Invite and manage members</p>
            </div>
          </div>
          {owned.length > 1 && (
            <select
              className="form-input max-w-[220px] py-1.5 text-sm"
              value={businessId}
              onChange={(e) => setSelected(e.target.value)}
            >
              {owned.map((b) => (
                <option key={b.business._id} value={b.business._id}>{b.business.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Invite card */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-success-50 rounded-lg flex items-center justify-center">
              <UserPlus size={16} className="text-success-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">Invite a team member</h3>
              <p className="text-xs text-surface-400">Existing users join instantly. New users get a signup link.</p>
            </div>
          </div>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              required
            />
            <Input
              label="Display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Priya — Design"
            />
            <div className="flex items-end">
              <Button variant="primary" type="submit" disabled={inviteResult.isLoading} className="w-full">
                {inviteResult.isLoading ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </form>
          {inviteLink && (
            <div className="mt-3 rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-brand-600 mb-0.5">Invite link generated</p>
                <p className="text-xs text-brand-700 truncate font-mono">{inviteLink}</p>
              </div>
              <Button variant="secondary" size="sm" icon={<Copy size={13} />} onClick={copyLink}>
                Copy
              </Button>
            </div>
          )}
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-display font-bold text-brand-600">{members.length}</p>
            <p className="text-xs text-surface-400 mt-1">Team Members</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-display font-bold text-warning-600">{invites.length}</p>
            <p className="text-xs text-surface-400 mt-1">Pending Invites</p>
          </div>
        </div>

        {/* Members list */}
        <div>
          <SectionTitle title="Team Members" subtitle={`${members.length} total`} className="mb-3" />
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : members.length === 0 ? (
            <EmptyState icon={<Users size={24} />} title="No members yet" description="Invite someone to get started." />
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m._id} className="card flex items-center gap-3 p-4">
                  <Avatar name={m.userId.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-surface-900 truncate text-sm">{m.displayName}</p>
                      <span className="text-surface-400 text-xs">·</span>
                      <span className="text-xs text-surface-500 truncate">{m.userId.name}</span>
                    </div>
                    <p className="truncate text-xs text-surface-400">{m.userId.email}</p>
                  </div>
                  <Badge variant={m.role === 'OWNER' ? 'brand' : 'info'} size="xs">{m.role}</Badge>
                  {m.role !== 'OWNER' && (
                    <button
                      onClick={() => setRemoveTarget({ id: m._id, name: m.displayName })}
                      className="p-1.5 rounded-lg text-surface-300 hover:text-danger-500 hover:bg-danger-50 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending invites */}
        {invites.length > 0 && (
          <div>
            <SectionTitle title="Pending Invitations" subtitle="Waiting to be accepted" className="mb-3" />
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv._id} className="card flex items-center gap-3 p-3.5">
                  <div className="w-8 h-8 bg-warning-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={14} className="text-warning-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-800 text-sm truncate">{inv.email}</p>
                    {inv.displayName && <p className="text-xs text-surface-400">{inv.displayName}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-surface-400">
                    <Clock size={12} />
                    <span>Expires {new Date(inv.expiresAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <Badge variant="warning" size="xs">Pending</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        title={`Remove ${removeTarget?.name}?`}
        description="They will lose access to this team immediately. You can re-invite them later."
        confirmLabel="Remove"
        variant="danger"
        loading={removeResult.isLoading}
      />
    </div>
  );
}
