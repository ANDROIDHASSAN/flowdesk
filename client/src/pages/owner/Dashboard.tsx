import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Users, CheckSquare, Clock, TrendingUp, AlertTriangle, Zap, Target,
  ArrowRight, BarChart3, ChevronRight
} from 'lucide-react';
import { useGetAdminOverviewQuery, useGetAllStreaksQuery, useGetBusinessesQuery, useGetMyStreakQuery, useGetOverviewQuery } from '../../api/endpoints';
import { useAppSelector } from '../../store';
import { Avatar, Badge, LoadingPage, ProgressBar, ScoreRing, SectionTitle, StatCard } from '../../components/ui';
import { fmtMinutes } from '../../lib/dates';

interface StreakEntry {
  _id: string;
  userId: { _id: string; name: string };
  currentStreak: number;
  xpPoints: number;
  level: number;
  weeklyActivity: { date: string; score: number }[];
}

interface AdminOverview {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  totalHoursThisMonth: number;
  activeToday: number;
  logsToday: number;
  pendingFollowups: number;
}

const productivityData = [
  { day: 'Mon', tasks: 12, hours: 6.5, score: 82 },
  { day: 'Tue', tasks: 15, hours: 7.2, score: 88 },
  { day: 'Wed', tasks: 9, hours: 5.8, score: 74 },
  { day: 'Thu', tasks: 18, hours: 8.1, score: 92 },
  { day: 'Fri', tasks: 14, hours: 7.0, score: 85 },
  { day: 'Sat', tasks: 6, hours: 3.5, score: 71 },
];

const taskStatusData = [
  { name: 'Completed', value: 45, color: '#10B981' },
  { name: 'In Progress', value: 28, color: '#3B82F6' },
  { name: 'Todo', value: 19, color: '#94A3B8' },
  { name: 'Overdue', value: 8, color: '#F43F5E' },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-900 text-white px-3 py-2.5 rounded-xl shadow-xl text-xs">
      <p className="font-semibold mb-1.5 text-surface-200">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-surface-300">{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const businessId = useAppSelector((s) => s.ui.businessId);
  const { data: bizData } = useGetBusinessesQuery();
  const ownedBizId = (bizData?.businesses || []).find((b) => b.role === 'OWNER')?.business._id || '';
  const effectiveBizId = businessId !== 'all' ? businessId : ownedBizId;

  const { data, isLoading } = useGetOverviewQuery(businessId, { pollingInterval: 120_000 });
  const { data: adminData } = useGetAdminOverviewQuery(effectiveBizId, { skip: !effectiveBizId });
  const { data: allStreakData } = useGetAllStreaksQuery(effectiveBizId, { skip: !effectiveBizId });
  const { data: myStreakData } = useGetMyStreakQuery(effectiveBizId, { skip: !effectiveBizId });

  const navigate = useNavigate();
  const [, setSelectedMember] = useState<string | null>(null);

  const admin = adminData?.overview as AdminOverview | undefined;
  const myStreak = myStreakData?.streak;

  const streaksByUserId = useMemo(() => {
    const map: Record<string, StreakEntry> = {};
    for (const s of (allStreakData?.streaks || []) as StreakEntry[]) {
      map[s.userId._id] = s;
    }
    return map;
  }, [allStreakData]);

  const getMemberScore = (userId: string): number => {
    const s = streaksByUserId[userId];
    if (!s || s.weeklyActivity.length === 0) return 0;
    return Math.min(100, s.weeklyActivity[s.weeklyActivity.length - 1].score);
  };

  if (isLoading) return <LoadingPage message="Loading dashboard..." />;

  const members = data?.members || [];
  const needs = data?.needsAttention;

  const totalTasks = members.reduce((s, m) => s + (m.openTasks || 0), 0);
  const totalMinutes = members.reduce((s, m) => s + (m.minutesToday || 0), 0);
  const activeToday = members.filter((m) => m.minutesToday > 0).length;

  const overdueTasks = (needs?.overdueTasks || []).length;
  const noLog = (needs?.notLoggedToday || []).length;
  const pendingFollowups = (needs?.overdueFollowups || []).length;

  return (
    <div className="animate-fade-up">
      {/* Page Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-surface-900">Dashboard</h1>
            <p className="text-sm text-surface-500 mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {myStreak && myStreak.currentStreak > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                <span className="text-xl">🔥</span>
                <div>
                  <p className="text-xs font-bold text-orange-600">On a streak!</p>
                  <p className="text-[10px] text-orange-400">{myStreak.currentStreak} day streak</p>
                </div>
              </div>
            )}
            <Link to="/board" className="btn btn-primary btn-sm gap-1.5">
              <CheckSquare size={14} />
              Task Board
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Alert banner */}
        {(overdueTasks + noLog + pendingFollowups) > 0 && (
          <div className="bg-warning-50 border border-warning-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle size={18} className="text-warning-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-warning-700">Needs attention: </span>
              <span className="text-sm text-warning-600">
                {[
                  overdueTasks > 0 && `${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`,
                  noLog > 0 && `${noLog} member${noLog > 1 ? 's' : ''} missing daily log`,
                  pendingFollowups > 0 && `${pendingFollowups} overdue follow-up${pendingFollowups > 1 ? 's' : ''}`,
                ].filter(Boolean).join(' · ')}
              </span>
            </div>
            <Link to="/admin" className="text-xs font-semibold text-warning-700 hover:text-warning-800 flex items-center gap-1 flex-shrink-0">
              View all <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Team Members"
            value={members.length}
            icon={<Users size={20} className="text-brand-600" />}
            iconBg="bg-brand-100 text-brand-600"
            subtitle={`${activeToday} active today`}
            trend={{ value: 0, label: 'this month' }}
            accent="bg-gradient-to-r from-brand-500 to-brand-400"
          />
          <StatCard
            label="Open Tasks"
            value={totalTasks}
            icon={<CheckSquare size={20} className="text-success-600" />}
            iconBg="bg-success-100 text-success-600"
            subtitle={`${overdueTasks} overdue`}
            trend={{ value: -5, label: 'vs yesterday' }}
            accent="bg-gradient-to-r from-success-500 to-success-400"
          />
          <StatCard
            label="Hours Logged Today"
            value={fmtMinutes(totalMinutes)}
            icon={<Clock size={20} className="text-info-600" />}
            iconBg="bg-info-100 text-info-600"
            subtitle="across team"
            trend={{ value: 12, label: 'vs yesterday' }}
            accent="bg-gradient-to-r from-info-500 to-info-400"
          />
          <StatCard
            label="Avg Performance"
            value="—/100"
            icon={<TrendingUp size={20} className="text-purple-600" />}
            iconBg="bg-purple-100 text-purple-600"
            subtitle="team score"
            trend={{ value: 0, label: 'vs last week' }}
            accent="bg-gradient-to-r from-purple-500 to-purple-400"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 chart-container">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="chart-title">Team Productivity</h3>
                <p className="chart-subtitle">Tasks completed & hours worked this week</p>
              </div>
              <Badge variant="success" dot>Live</Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="tasksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tasks" name="Tasks" stroke="#6366F1" strokeWidth={2.5} fill="url(#tasksGrad)" dot={{ fill: '#6366F1', r: 4 }} activeDot={{ r: 6, fill: '#6366F1' }} />
                <Area type="monotone" dataKey="hours" name="Hours" stroke="#10B981" strokeWidth={2.5} fill="url(#hoursGrad)" dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3 className="chart-title mb-1">Task Status</h3>
            <p className="chart-subtitle mb-4">Distribution of all tasks</p>
            {(() => {
              const pieData = admin
                ? [
                    { name: 'Completed', value: admin.completedTasks, color: '#10B981' },
                    { name: 'Active', value: Math.max(0, admin.totalTasks - admin.completedTasks - admin.overdueTasks), color: '#3B82F6' },
                    { name: 'Overdue', value: admin.overdueTasks, color: '#F43F5E' },
                  ].filter((d) => d.value > 0)
                : taskStatusData;
              return (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} tasks`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-xs text-surface-500 truncate">{item.name}</span>
                        <span className="text-xs font-bold text-surface-700 ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Team Members */}
        <div>
          <SectionTitle
            title="Team Overview"
            subtitle={`${members.length} members · ${activeToday} active today`}
            action={
              <Link to="/members" className="btn btn-secondary btn-sm">
                Manage Team <ArrowRight size={14} />
              </Link>
            }
            className="mb-4"
          />

          {members.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-surface-300" />
              </div>
              <h3 className="text-base font-semibold text-surface-700 mb-2">No team members yet</h3>
              <p className="text-sm text-surface-400 mb-4">Invite your team to start tracking performance</p>
              <Link to="/members" className="btn btn-primary btn-sm mx-auto">Invite Team Members</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {members.map((m) => (
                <div
                  key={m.userId}
                  onClick={() => { setSelectedMember(m.userId); navigate(`/team/${m.userId}`); }}
                  className="card p-4 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar name={m.name} size="md" online={m.minutesToday > 0} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-surface-900 truncate text-sm">{m.name}</p>
                        {m.isOwner && <Badge variant="brand" size="xs">Owner</Badge>}
                      </div>
                      <p className="text-xs text-surface-400 mt-0.5">
                        {m.minutesToday > 0 ? `Active · ${fmtMinutes(m.minutesToday)} today` : 'Not active today'}
                      </p>
                    </div>
                    <ScoreRing score={getMemberScore(m.userId)} size={44} strokeWidth={4} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Tasks', value: m.openTasks || 0, color: 'text-brand-600' },
                      { label: 'Hours', value: m.minutesToday ? `${Math.round(m.minutesToday / 60 * 10) / 10}h` : '0h', color: 'text-success-600' },
                      { label: 'Log', value: m.loggedToday ? '✓' : '—', color: m.loggedToday ? 'text-success-600' : 'text-danger-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center p-2 bg-surface-50 rounded-lg">
                        <p className={`text-sm font-bold ${color}`}>{value}</p>
                        <p className="text-[10px] text-surface-400 uppercase tracking-wider">{label}</p>
                      </div>
                    ))}
                  </div>

                  <ProgressBar value={m.followupsDueToday > 0 ? 60 : m.loggedToday ? 80 : 40} max={100} size="xs" variant={m.loggedToday ? 'success' : 'warning'} />

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-surface-400">Activity today</span>
                    <ArrowRight size={14} className="text-surface-300 group-hover:text-brand-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <SectionTitle title="Quick Actions" className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: '/board', icon: <CheckSquare size={20} />, label: 'Task Board', color: 'bg-brand-50 text-brand-600 hover:bg-brand-100' },
              { to: '/pipeline', icon: <Target size={20} />, label: 'Follow-ups', color: 'bg-success-50 text-success-600 hover:bg-success-100' },
              { to: '/projects', icon: <Zap size={20} />, label: 'Projects', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
              { to: '/admin', icon: <BarChart3 size={20} />, label: 'View Reports', color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
            ].map(({ to, icon, label, color }) => (
              <Link key={to} to={to} className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${color} border border-transparent`}>
                {icon}
                <span className="text-xs font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Score Bar Chart */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="chart-title">Performance Scores This Week</h3>
              <p className="chart-subtitle">Daily team performance tracking</p>
            </div>
            <Badge variant="info">Last 7 days</Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={productivityData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Bar dataKey="score" name="Score" radius={[6, 6, 0, 0]}
                label={{ position: 'top', fontSize: 11, fill: '#64748B', fontWeight: 600 }}
              >
                {productivityData.map((entry, index) => (
                  <Cell key={index} fill={entry.score >= 85 ? '#10B981' : entry.score >= 70 ? '#6366F1' : '#F59E0B'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
