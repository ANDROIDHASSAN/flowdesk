import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Users, CheckSquare, Clock, AlertTriangle, TrendingUp, Shield, DollarSign,
  Eye, Activity, Star, FileText, Download
} from 'lucide-react';
import { useAppSelector } from '../../store';
import { useGetAdminEmployeesQuery, useGetAdminOverviewQuery, useGetBusinessesQuery, useGetPaymentsQuery } from '../../api/endpoints';
import { Avatar, Badge, MetricCard, ProgressBar, ScoreRing, SearchInput, SectionTitle, Spinner, Tabs } from '../../components/ui';
import { fmtMinutes } from '../../lib/dates';

interface AdminEmployee {
  userId: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  activeTasks: number;
  completedThisWeek: number;
  todayMinutes: number;
  hasLoggedToday: boolean;
  currentStreak: number;
  xpPoints: number;
  level: number;
  pendingFollowups: number;
  latestScore: number;
  salary?: number;
  isOnVacation?: boolean;
}

interface AdminOverview {
  totalMembers: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  totalHoursThisMonth: number;
  activeToday: number;
  logsToday: number;
  pendingFollowups: number;
}

interface Payment {
  _id: string;
  userId: { _id: string; name: string } | string;
  displayName?: string;
  baseSalary?: number;
  bonus?: number;
  deductions?: number;
  total?: number;
  status: string;
  period: string;
}

const ACTIVITY_DATA = [
  { day: 'Mon', hours: 0, tasks: 0 },
  { day: 'Tue', hours: 0, tasks: 0 },
  { day: 'Wed', hours: 0, tasks: 0 },
  { day: 'Thu', hours: 0, tasks: 0 },
  { day: 'Fri', hours: 0, tasks: 0 },
];

function EmployeeRow({ emp, onView }: { emp: AdminEmployee; onView: (id: string) => void }) {
  const scoreColor = emp.latestScore >= 80 ? 'text-success-600' : emp.latestScore >= 60 ? 'text-warning-600' : 'text-danger-500';
  return (
    <tr className="border-b border-surface-50 hover:bg-surface-50 transition-colors cursor-pointer group" onClick={() => onView(emp.userId)}>
      <td className="px-4 py-3 min-w-[180px]">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <Avatar name={emp.name} size="sm" />
            {emp.isOnVacation && <span className="absolute -top-1 -right-1 text-[10px]">🏖️</span>}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-surface-900 truncate">{emp.name}</p>
            <p className="text-xs text-surface-400 truncate">{emp.designation || emp.role}{emp.department ? ` · ${emp.department}` : ''}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🔥</span>
          <span className="text-sm font-bold text-orange-600">{emp.currentStreak}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ScoreRing score={emp.latestScore} size={34} strokeWidth={4} />
          <span className={`text-sm font-bold hidden sm:block ${scoreColor}`}>{emp.latestScore}</span>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="text-sm">
          <span className="font-semibold text-success-600">{emp.completedThisWeek}</span>
          <span className="text-surface-400 mx-1">/</span>
          <span className="text-surface-600">{emp.activeTasks} open</span>
        </div>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-sm font-medium text-surface-700">{fmtMinutes(emp.todayMinutes)}</span>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {emp.hasLoggedToday
          ? <Badge variant="success" dot>Logged</Badge>
          : <Badge variant="danger" dot>Missing</Badge>}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-sm font-semibold text-surface-700">
          {emp.salary ? `₹${emp.salary.toLocaleString('en-IN')}` : '—'}
        </span>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        {emp.isOnVacation
          ? <Badge variant="warning">Vacation</Badge>
          : emp.todayMinutes > 0
            ? <Badge variant="success" dot>Active</Badge>
            : <Badge variant="gray" dot>Offline</Badge>}
      </td>
      <td className="px-4 py-3">
        <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-brand-50 text-surface-400 hover:text-brand-600 transition-all">
          <Eye size={14} />
        </button>
      </td>
    </tr>
  );
}

export default function AdminPanel() {
  const businessId = useAppSelector((s) => s.ui.businessId);
  const { data: bizData } = useGetBusinessesQuery();
  const firstBizId = (bizData?.businesses || [])[0]?.business._id || '';
  const effectiveBizId = businessId !== 'all' ? businessId : firstBizId;

  const { data: empData, isLoading: empLoading } = useGetAdminEmployeesQuery(effectiveBizId, { skip: !effectiveBizId });
  const { data: adminData } = useGetAdminOverviewQuery(effectiveBizId, { skip: !effectiveBizId });
  const { data: payData } = useGetPaymentsQuery({ businessId: effectiveBizId }, { skip: !effectiveBizId });

  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');

  const employees = (empData?.employees || []) as AdminEmployee[];
  const admin = adminData?.overview as AdminOverview | undefined;
  const payments = (payData?.payments || []) as Payment[];

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPayroll = employees.reduce((s, e) => s + (e.salary || 0), 0);
  const avgScore = employees.length
    ? Math.round(employees.reduce((s, e) => s + (e.latestScore || 0), 0) / employees.length)
    : 0;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <Activity size={14} /> },
    { key: 'employees', label: 'Employees', icon: <Users size={14} />, count: employees.length || undefined },
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
          <div className="hidden sm:flex items-center gap-2">
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
        <Tabs tabs={tabs} active={tab} onChange={setTab} variant="pill" />

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-6 animate-fade-up">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard icon={<Users size={20} />} label="Total Employees" value={admin?.totalMembers ?? employees.length} subValue={`${admin?.activeToday ?? 0} active today`} color="brand" trend={0} />
              <MetricCard icon={<Star size={20} />} label="Avg Performance" value={`${avgScore}%`} subValue="team average" color="success" trend={0} />
              <MetricCard icon={<DollarSign size={20} />} label="Monthly Payroll" value={totalPayroll ? `₹${(totalPayroll / 1000).toFixed(0)}K` : '—'} subValue="total this month" color="warning" trend={0} />
              <MetricCard icon={<AlertTriangle size={20} />} label="Needs Attention" value={admin ? admin.totalMembers - admin.logsToday : employees.filter((e) => !e.hasLoggedToday).length} subValue="missing daily log" color="danger" trend={0} />
            </div>

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

            <div>
              <SectionTitle
                title="Employee Status Today"
                action={<button onClick={() => setTab('employees')} className="btn btn-ghost btn-sm text-brand-600">View all →</button>}
                className="mb-3"
              />
              {empLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {employees.slice(0, 6).map((emp) => (
                    <div key={emp.userId} className="card p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/team/${emp.userId}`)}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                          <Avatar name={emp.name} size="md" online={emp.todayMinutes > 0} />
                          {emp.isOnVacation && <span className="absolute -top-1 -right-1 text-xs">🏖️</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-surface-900 truncate">{emp.name}</p>
                          <p className="text-xs text-surface-400 truncate">{emp.designation || emp.department || emp.role}</p>
                        </div>
                        <ScoreRing score={emp.latestScore} size={36} strokeWidth={3.5} />
                      </div>
                      <div className="flex gap-3 text-xs flex-wrap">
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
                          {emp.hasLoggedToday
                            ? <Badge variant="success" size="xs">✓ Log</Badge>
                            : <Badge variant="danger" size="xs">No log</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Employees */}
        {tab === 'employees' && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center gap-3 flex-wrap">
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

            {empLoading ? (
              <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-100 bg-surface-50">
                        <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Employee</th>
                        <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Streak</th>
                        <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Score</th>
                        <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Tasks</th>
                        <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Hours Today</th>
                        <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Daily Log</th>
                        <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Salary</th>
                        <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Status</th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-surface-400">No employees found</td></tr>
                      ) : (
                        filtered.map((emp) => (
                          <EmployeeRow key={emp.userId} emp={emp} onView={(id) => navigate(`/team/${id}`)} />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Performance */}
        {tab === 'performance' && (
          <div className="space-y-6 animate-fade-up">
            {empLoading ? (
              <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {employees.map((emp) => (
                  <div key={emp.userId} className="card p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar name={emp.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-surface-900 text-sm truncate">{emp.name}</p>
                        <p className="text-xs text-surface-400">{emp.department || emp.role}</p>
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
            )}
          </div>
        )}

        {/* Payments */}
        {tab === 'payments' && (
          <div className="space-y-4 animate-fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard icon={<DollarSign size={18} />} label="Total Payroll" value={totalPayroll ? `₹${(totalPayroll / 1000).toFixed(0)}K` : '—'} color="brand" />
              <MetricCard icon={<CheckSquare size={18} />} label="Paid" value={`${payments.filter((p) => p.status === 'PAID').length} paid`} color="success" />
              <MetricCard icon={<Clock size={18} />} label="Pending" value={`${payments.filter((p) => p.status !== 'PAID').length} pending`} color="warning" />
            </div>
            <div className="card p-8 text-center">
              <DollarSign size={32} className="text-surface-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-surface-700 mb-1">Full Payroll Management</h3>
              <p className="text-sm text-surface-400 mb-4">Generate, approve, and mark salaries paid from the dedicated Payments page.</p>
              <Link to="/payments" className="btn btn-primary btn-sm mx-auto">
                Go to Payments →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
