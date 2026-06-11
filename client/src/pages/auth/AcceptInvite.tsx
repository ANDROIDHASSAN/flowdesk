import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAcceptInviteMutation } from '../../api/endpoints';
import { Card } from '../../components/ui';

/** Logged-in users landing on an invite link join the business directly. */
export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [acceptInvite, { error }] = useAcceptInviteMutation();
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    acceptInvite({ token })
      .unwrap()
      .then(() => {
        setDone(true);
        setTimeout(() => navigate('/'), 1200);
      })
      .catch(() => null);
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm p-8 text-center">
        <p className="font-display text-2xl font-black text-pine">
          Pulse<span className="text-marigold">.</span>
        </p>
        {done ? (
          <p className="mt-4 font-semibold text-pine">✅ Invite accepted! Taking you in…</p>
        ) : error ? (
          <p className="mt-4 text-sm text-danger-600 font-semibold">
            {(error as { data?: { message?: string } })?.data?.message || 'Invalid or expired invite link.'}
          </p>
        ) : (
          <p className="mt-4 text-sm text-ink/55">Accepting your invite…</p>
        )}
      </Card>
    </div>
  );
}
