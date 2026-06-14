import { useState } from 'react';
import { useGetBusinessesQuery, useCreateBusinessMutation } from '../api/endpoints';
import { useAppDispatch, useAppSelector } from '../store';
import { setBusiness } from '../store/uiSlice';
import { Input, Modal, Button } from './ui';

/** Top-level switcher: "All businesses" or a single business; scopes every screen. */
export default function BusinessSwitcher() {
  const dispatch = useAppDispatch();
  const businessId = useAppSelector((s) => s.ui.businessId);
  const { data } = useGetBusinessesQuery();
  const [createBusiness, { isLoading, error }] = useCreateBusinessMutation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const rows = data?.businesses || [];
  const ownsAny = rows.some((r) => r.role === 'OWNER');

  return (
    <>
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden text-marigold sm:block">
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" strokeLinecap="round" />
        </svg>
        <select
          value={businessId}
          onChange={(e) => (e.target.value === '__new__' ? setOpen(true) : dispatch(setBusiness(e.target.value)))}
          className="input max-w-[180px] cursor-pointer py-1.5 font-semibold sm:max-w-[240px]"
          aria-label="Switch business"
        >
          <option value="all">All businesses</option>
          {rows.map((r) => (
            <option key={r.business._id} value={r.business._id}>
              {r.business.name} {r.role === 'OWNER' ? '👑' : ''}
            </option>
          ))}
          {ownsAny || rows.length === 0 ? <option value="__new__">＋ New business…</option> : null}
        </select>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create business">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            const result = await createBusiness({ name }).unwrap().catch(() => null);
            if (result) {
              dispatch(setBusiness(result.business._id));
              setName('');
              setOpen(false);
            }
          }}
          className="space-y-3"
        >
          <Input label="Business name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mehta Digital Agency" />
          {error && <p className="text-sm text-danger-600">{(() => { const m = (error as any)?.data?.message; return typeof m === 'string' ? m : 'Failed to create business'; })()}</p>}
          <Button variant="primary" type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating…' : 'Create business'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
