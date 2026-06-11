import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap, TrendingUp, Users, BarChart3, ArrowRight, Flame } from 'lucide-react';
import { useLoginMutation } from '../../api/endpoints';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/authSlice';
import { Button, Input, Alert } from '../../components/ui';

const DEMO_ACCOUNTS = [
  { label: 'Owner Demo', email: 'owner@pulse.demo', password: 'pulse1234', color: 'bg-brand-500' },
  { label: 'Member Demo', email: 'priya@pulse.demo', password: 'pulse1234', color: 'bg-success-500' },
];

const FEATURES = [
  { icon: <TrendingUp size={20} />, title: '10x Productivity', desc: 'AI-powered insights save 80% of management time' },
  { icon: <Users size={20} />, title: 'Team Tracking', desc: 'Real-time visibility into every employee\'s work' },
  { icon: <BarChart3 size={20} />, title: 'Smart Analytics', desc: 'Performance scores, streaks & gamification' },
  { icon: <Flame size={20} />, title: 'Streak System', desc: 'Keep your team motivated with daily streaks & XP' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials(res));
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { data?: { error?: string } })?.data?.error || 'Invalid email or password');
    }
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between bg-sidebar-bg p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-success-500/5 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-white text-xl tracking-tight">FlowDesk</span>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Work Smarter</p>
            </div>
          </div>
          <div className="mb-12">
            <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight mb-4">
              Manage your team like a{' '}
              <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">10x leader</span>
            </h1>
            <p className="text-lg text-white/50 leading-relaxed">
              Stop wasting time on Excel. Track tasks, time, performance & payments — powered by AI.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">{f.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 flex gap-8 pt-8 border-t border-white/10">
          {[['50hrs→5hrs', 'Avg time saved/week'], ['94%', 'Team satisfaction'], ['3.2x', 'Productivity boost']].map(([val, label]) => (
            <div key={label}>
              <p className="text-2xl font-display font-bold text-white">{val}</p>
              <p className="text-xs text-white/35 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-surface-900 text-lg">FlowDesk</span>
          </div>
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-surface-900">Welcome back</h2>
            <p className="text-surface-500 mt-1">Sign in to manage your team</p>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Quick Demo Access</p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button key={acc.email} type="button" onClick={() => fillDemo(acc)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 ${acc.color}`}>
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-surface-200" />
            <span className="text-xs text-surface-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-surface-200" />
          </div>

          {error && <Alert variant="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com" icon={<Mail size={16} />} autoComplete="email" required />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password" autoComplete="current-password" required />
            <Button type="submit" variant="primary" size="lg" full loading={isLoading} iconRight={<ArrowRight size={16} />}>
              Sign in to FlowDesk
            </Button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">Create one free →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
