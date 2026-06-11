import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, User, Zap, ArrowRight, Building2 } from 'lucide-react';
import { useRegisterMutation } from '../../api/endpoints';
import { Button, Input, Alert } from '../../components/ui';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/authSlice';

export default function Register() {
  const [params] = useSearchParams();
  const inviteToken = params.get('token') || '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    try {
      const res = await register({ name, email, password, inviteToken: inviteToken || undefined }).unwrap();
      dispatch(setCredentials(res));
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { data?: { error?: string } })?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-surface-900 text-xl">FlowDesk</span>
        </div>

        <div className="card p-8 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-surface-900">
              {inviteToken ? 'Join your team' : 'Create your account'}
            </h2>
            <p className="text-surface-500 mt-1 text-sm">
              {inviteToken ? 'Accept your invitation and get started' : 'Start managing your team smarter'}
            </p>
          </div>

          {error && <Alert variant="error" className="mb-5" onClose={() => setError('')}>{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your full name" icon={<User size={16} />} required autoComplete="name" />
            <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com" icon={<Mail size={16} />} required autoComplete="email" />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters" hint="Must be at least 8 characters" required autoComplete="new-password" />
            {!inviteToken && (
              <Input label="Company / Business name" type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                placeholder="Your company name" icon={<Building2 size={16} />} hint="You can set this up later" />
            )}

            <Button type="submit" variant="primary" size="lg" full loading={isLoading} iconRight={<ArrowRight size={16} />}>
              {inviteToken ? 'Join Team' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">Sign in →</Link>
          </p>
        </div>

        <p className="text-center text-xs text-surface-400 mt-4">
          By creating an account, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
