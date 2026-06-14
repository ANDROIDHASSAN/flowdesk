import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, User, Zap, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { useRegisterMutation } from '../../api/endpoints';
import { Button, Input, Alert } from '../../components/ui';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/authSlice';

const BENEFITS = [
  'Task board with drag & drop',
  'Time tracking & daily logs',
  'Team performance scores',
  'Payroll & streak system',
  'AI-powered insights',
];

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
      const msg = (err as any)?.data?.error;
      setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 flex-col justify-between bg-sidebar-bg p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-white text-xl tracking-tight">FlowDesk</span>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Work Smarter</p>
            </div>
          </div>
          <h2 className="text-3xl font-display font-bold text-white leading-tight mb-3">
            {inviteToken ? 'You\'ve been invited!' : 'Start for free today'}
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            {inviteToken
              ? 'Create your account to join your team and get started immediately.'
              : 'Set up your team workspace in minutes. No credit card required.'}
          </p>
          <div className="space-y-3">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={12} className="text-brand-400" />
                </div>
                <span className="text-sm text-white/60">{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white/70 text-sm italic leading-relaxed">
              "FlowDesk cut our weekly reporting time from 4 hours to 20 minutes."
            </p>
            <p className="text-white/40 text-xs mt-2 font-medium">— Arjun M., Agency Owner</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-surface-900 text-lg">FlowDesk</span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-display font-bold text-surface-900">
              {inviteToken ? 'Join your team' : 'Create your account'}
            </h2>
            <p className="text-surface-500 mt-1">
              {inviteToken ? 'Accept your invitation and get started' : 'Start managing your team smarter'}
            </p>
          </div>

          {error && <Alert variant="error" className="mb-5" onClose={() => setError('')}>{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              icon={<User size={16} />}
              required
              autoComplete="name"
            />
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              icon={<Mail size={16} />}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              hint="Must be at least 8 characters"
              required
              autoComplete="new-password"
            />
            {!inviteToken && (
              <Input
                label="Company / Business name"
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="Your company name"
                icon={<Building2 size={16} />}
                hint="You can set this up later"
              />
            )}
            <Button type="submit" variant="primary" size="lg" full loading={isLoading} iconRight={<ArrowRight size={16} />}>
              {inviteToken ? 'Join Team' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">Sign in →</Link>
          </p>

          <p className="text-center text-xs text-surface-400 mt-4">
            By creating an account, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
