import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAcceptInviteMutation } from '../../api/endpoints';
import { Zap, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

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
        setTimeout(() => navigate('/'), 1500);
      })
      .catch(() => null);
  }, [token]);

  const errorMsg = (() => {
    const m = (error as any)?.data?.message;
    return typeof m === 'string' ? m : 'Invalid or expired invite link.';
  })();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-surface-900 text-xl">FlowDesk</span>
        </div>

        <div className="card p-8 text-center shadow-lg">
          {done ? (
            <>
              <div className="w-14 h-14 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-success-600" />
              </div>
              <h2 className="text-xl font-display font-bold text-surface-900 mb-1">You're in!</h2>
              <p className="text-sm text-surface-500">Invite accepted. Taking you to your workspace…</p>
            </>
          ) : error ? (
            <>
              <div className="w-14 h-14 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={28} className="text-danger-600" />
              </div>
              <h2 className="text-xl font-display font-bold text-surface-900 mb-1">Invite failed</h2>
              <p className="text-sm text-danger-600">{errorMsg}</p>
              <a href="/login" className="mt-4 inline-block text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                Go to login →
              </a>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={28} className="text-brand-600 animate-spin" />
              </div>
              <h2 className="text-xl font-display font-bold text-surface-900 mb-1">Accepting invite…</h2>
              <p className="text-sm text-surface-500">Please wait while we set up your access.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
