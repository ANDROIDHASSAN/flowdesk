import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  Users, CheckSquare, Clock, AlertTriangle, TrendingUp, Shield, DollarSign,
  Eye, ChevronRight, Activity, Star, Flame, Target, Award, FileText,
  Download, Calendar, Search
} from 'lucide-react';
import { useAppSelector } from '../../store';
import { Avatar, Badge, LoadingPage, MetricCard, ProgressBar, ScoreRing, SearchInput, SectionTitle, StatCard, Tabs } from '../../components/ui';
import { fmtMinutes } from '../../lib/dates';

// Simulated admin data — will connect to /api/admin endpoints
const MOCK_EMPLOYEES = [
  { userId: '1', name: 'Priya Sharma', email: 'priya@team.com', role: 'MEMBER', department: 'Engineering', designation: 'Senior Dev', activeTasks: 5, completedThisWeek: 12, todayMinutes: 390, hasLoggedToday: true, currentStreak: 15, xpPoints: 2450, level: 5, pendingFollowups: 2, latestScore: 88, salary: 75000, isOnVacation: false },
  { userId: '2', name: 'Rahul Verma', email: 'rahul@team.com', role: 'MEMBER', department: 'Design', designation: 'UI/UX Designer', activeTasks: 3, completedThisWeek: 8, todayMinutes: 180, hasLoggedToday: false, currentStreak: 7, xpPoints: 1200, level: 3, pendingFollowups: 1, latestScore: 74, salary: 65000, isOnVacation: false },
  { userId: '3', name: 'Sana Khan', email: 'sana@team.com', role: 'MEMBER', department: 'Sales', designation: 'Account Manager', activeTasks: 8, completedThisWeek: 15, todayMinutes: 420, hasLoggedToday: true, currentStreak: 22, xpPoints: 3800, level: 7, pendingFollowups: 5, latestScore: 92, salary: 70000, isOnVacation: true },
];

const ACTIVITY_DATA = [
  { day: 'Mon', hours: 45, tasks: 32 },
  { day: 'Tue', hours: 52, tasks: 41 },
  { day: 'Wed', hours: 38, tasks: 28 },
  { day: 'Thu', hours: 58, tasks: 47 },
  { day: 'Fri', hours: 49, tasks: 38 },
];

function EmployeeRow({ emp, onView }: { emp: typeof MOCK_EMPLOYEES[0]; onView: (id: string) => void }) {
  const scoreColor = emp.latestScore >= 80 ? 'text-success-600' : emp.latestScore >= 60 ? 'text-warning-600' : 'text-danger-500';
  return (
    <tr className="border-b border-surface-50 hover:bg-surface-50 transition-colors cursor-pointer" onClick={() => onView(emp.userId)}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={emp.name} size="sm" />
            {emp.isOnVacation && (
              <span className="absolute -top-1 -right-1 text-[10px]">🏖️</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">{emp.name}</p>
            <p className="text-xs text-surface-400">{emp.designation} · {emp.department}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-lg" style={{ animation: emp.currentStreak > 0 ? 'streakFire 1.5s ease-in-out infinite' : 'none' }}>🔥</span>
          <span className="text-sm font-bold text-orange-600">{emp.currentStreak}</span>
          <span className="text-xs text-surface-400">days</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ScoreRing score={emp.latestScore} size={36} strokeWidth={4} />
          <span className={`text-sm font-bold ${scoreColor}`}>{emp.latestScore}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm">
          <span className="font-semibold text-success-600">{emp.completedThisWeek}</span>
          <span className="text-surface-400 mx-1">/</span>
          <span className="text-surface-600">{emp.activeTasks} active</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-surface-700 font-medium">{fmtMinutes(emp.todayMinutes)}</span>
      </td>
      <td className="px-4 py-3">
        {emp.hasLoggedToday ? (
          <Badge variant="success" dot>Logged</Badge>
        ) : (
          <Badge variant="danger" dot>Missing</Badge>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-surface-700">
          ₹{emp.salary?.toLocaleString('en-IN') || '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        {emp.isOnVacation ? (
          <Badge variant="warning">On Vacation</Badge>
        ) : emp.todayMinutes > 0 ? (
          <Badge variant="success" dot>Active</Badge>
        ) : (
          <Badge variant="gray" dot>Offline</Badge>
        )}
      </td>
      <td className="px-4 py-3">
        <button className="p-1.5 rounded-lg hover:bg-brand-50 text-surface-400 hover:text-brand-600 transition-colors">
          <Eye size={14} />
        </button>
      </td>
    </tr>
  );
}

export default function AdminPanel() {
  const businessId = useAppSelector((s) => s.ui.businessId);
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');

  const filteredEmployees = MOCK_EMPLOYEES.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPayroll = MOCK_EMPLOYEES.reduce((s, e) => s + (e.salary || 0), 0);
  const activeCount = MOCK_EMPLOYEES.filter(e => e.todayMinutes > 0).length;
  const avgScore = Math.round(MOCK_EMPLOYEES.reduce((s, e) => s + e.latestScore, 0) / MOCK_EMPLOYEES.length);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <Activity size={14} /> },
    { key: 'employees', label: 'Employees', icon: <Users size={14} />, count: MOCK_EMPLOYEES.length },
    { key: 'performance', label: 'Performance', icon: <TrendingUp size={14} /> },
    { key: 'payments', label: 'Payments', icon: <DollarSign size={14} /> },
  ];

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
              <Shield size={18} className="text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-surface-900">Admin Panel</h1>
              <p className="text-sm text-surface-500">Complete team oversight & management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary btn-sm gap-1.5">
              <Download size={14} /> Export
            </button>
            <button className="btn btn-secondary btn-sm gap-1.5">
              <FileText size={14} /> Report
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Tabs */}
        <Tabs tabs={tabs} active={tab} onChange={setTab} variant="pill" />

        {tab === 'overview' && (
          <div className="space-y-6 animate-fade-up">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard icon={<Users size={20} />} label="Total Employees" value={MOCK_EMPLOYEES.length} subValue={`${activeCount} active today`} color="brand" trend={0} />
              <MetricCard icon={<Star size={20} />} label="Avg Performance" value={`${avgScore}%`} subValue="team average" color="success" trend={5} />
              <MetricCard icon={<DollarSign size={20} />} label="Monthly Payroll" value={`₹${(totalPayroll/1000).toFixed(0)}K`} subValue="total this month" color="warning" trend={-2} />
              <MetricCard icon={<AlertTriangle size={20} />} label="Needs Attention" value={MOCK_EMPLOYEES.filter(e => !e.hasLoggedToday).length} subValue="missing daily log" color="danger" trend={0} />
            </div>

            {/* Activity Chart */}
            <div className="chart-container">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="chart-title">Team Activity This Week</h3>
                  <p className="chart-subtitle">Hours worked and tasks completed</p>
                </div>
                <Badge variant="info">7 days</Badge>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={ACTIVITY_DATA}>
                  <defs>
                    <linearGradient id="hoursGradAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="hours" name="Hours" stroke="#6366F1" strokeWidth={2.5} fill="url(#hoursGradAdmin)" />
                  <Area type="monotone" dataKey="tasks" name="Tasks" stroke="#10B981" strokeWidth={2.5} fill="none" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick employee overview */}
            <div>
              <SectionTitle title="Employee Status Today" action={
                <button onClick={() => setTab('employees')} className="btn btn-ghost btn-sm text-brand-600">View all →</button>
              } className="mb-3" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MOCK_EMPLOYEES.map(emp => (
                  <div key={emp.userId} className="card p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/team/${emp.userId}`)}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <Avatar name={emp.name} size="md" online={emp.todayMinutes > 0} />
                        {emp.isOnVacation && <span className="absolute -top-1 -right-1 text-xs">🏖️</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-surface-900 truncate">{emp.name}</p>
                        <p className="text-xs text-surface-400">{emp.designation}</p>
                      </div>
                      <ScoreRing score={emp.latestScore} size={36} strokeWidth={3.5} />
                    </div>
                    <div className="flex gap-3 text-xs">
                      <div className="flex items-center gap-1 text-orange-500">
                        <span>🔥</span><span className="font-bold">{emp.currentStreak}d</span>
                      </div>
                      <div className="flex items-center gap-1 text-success-600">
                        <CheckSquare size={12} /><span className="font-bold">{emp.completedThisWeek}</span>
                      </div>
                      <div className="flex items-center gap-1 text-info-600">
                        <Clock size={12} /><span className="font-bold">{fmtMinutes(emp.todayMinutes)}</span>
                      </div>
                      <div className="ml-auto">
                        {emp.hasLoggedToday ? <Badge variant="success" size="xs">✓ Log</Badge> : <Badge variant="danger" size="xs">No log</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'employees' && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center gap-3">
              <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." className="max-w-xs" />
              <select className="form-input py-2 text-sm max-w-[140px]">
                <option>All Depts</option>
                <option>Engineering</option>
                <option>Design</option>
                <option>Sales</option>
              </select>
              <select className="form-input py-2 text-sm max-w-[140px]">
                <option>All Status</option>
                <option>Active</option>
                <option>On Vacation</option>
                <option>Offline</option>
              </select>
            </div>

            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-100 bg-surface-50">
                      {['Employee', 'Streak', 'Score', 'Tasks', 'Hours Today', 'Daily Log', 'Salary', 'Status', ''].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map(emp => (
                      <EmployeeRow key={emp.userId} emp={emp} onView={(id) => navigate(`/team/${id}`)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'performance' && (
          <div className="space-y-6 animate-fade-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_EMPLOYEES.map(emp => (
                <div key={emp.userId} className="card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={emp.name} size="md" />
                    <div>
                      <p className="font-semibold text-surface-900 text-sm">{emp.name}</p>
                      <p className="text-xs text-surface-400">{emp.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <ScoreRing score={emp.latestScore} size={60} strokeWidth={5} label="Score" />
                    <div className="space-y-2 flex-1">
                      <ProgressBar value={emp.completedThisWeek} max={20} size="sm" variant="success" label="Tasks/Week" showLabel />
                      <ProgressBar value={emp.currentStreak} max={30} size="sm" variant="warning" label="Streak" showLabel />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-orange-500">
                      <span>🔥</span>
                      <span className="text-sm font-bold">{emp.currentStreak} day streak</span>
                    </div>
                    <div className="level-badge text-[10px] px-2 py-0.5">LVL {emp.level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select className="form-input py-2 text-sm max-w-[140px]">
                  <option>June 2025</option>
                  <option>May 2025</option>
                  <option>Apr 2025</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm">Generate All</button>
                <button className="btn btn-primary btn-sm">Approve All</button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <MetricCard icon={<DollarSign size={18} />} label="Total Payroll" value={`₹${(totalPayroll/1000).toFixed(0)}K`} color="brand" />
              <MetricCard icon={<CheckSquare size={18} />} label="Paid" value="₹0" subValue="0 employees" color="success" />
              <MetricCard icon={<Clock size={18} />} label="Pending" value={`₹${(totalPayroll/1000).toFixed(0)}K`} subValue={`${MOCK_EMPLOYEES.length} employees`} color="warning" />
            </div>

            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50">
                    {['Employee', 'Base Salary', 'Performance', 'Bonus', 'Deductions', 'Total', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_EMPLOYEES.map(emp => (
                    <tr key={emp.userId} className="border-b border-surface-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={emp.name} size="xs" />
                          <span className="text-sm font-medium text-surface-800">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-700 font-medium">₹{emp.salary?.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3"><ScoreRing score={emp.latestScore} size={28} strokeWidth={3} /></td>
                      <td className="px-4 py-3 text-sm text-success-600 font-semibold">
                        {emp.latestScore >= 80 ? `+₹${Math.round((emp.salary || 0) * 0.1 / 1000)}K` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-danger-500">₹0</td>
                      <td className="px-4 py-3 text-sm font-bold text-surface-900">
                        ₹{(emp.salary! + (emp.latestScore >= 80 ? Math.round(emp.salary! * 0.1) : 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3"><Badge variant="warning">Draft</Badge></td>
                      <td className="px-4 py-3">
                        <button className="btn btn-primary btn-xs">Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
