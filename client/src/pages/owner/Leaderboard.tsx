import { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Avatar, Badge, EmptyState, ProgressBar, ScoreRing, Spinner, Tabs } from '../../components/ui';
import { useAppSelector } from '../../store';
import { useGetAllStreaksQuery, useGetBusinessesQuery } from '../../api/endpoints';

interface StreakEntry {
  _id: string;
  userId: { _id: string; name: string; email?: string };
  currentStreak: number;
  longestStreak: number;
  xpPoints: number;
  level: number;
  badges: string[];
  totalActiveDays: number;
  weeklyActivity: { date: string; score: number }[];
}

const BADGE_DEFINITIONS = [
  { id: 'WEEK_WARRIOR', emoji: '⚡', name: 'Week Warrior', desc: '7-day streak', color: 'bg-brand-50 border-brand-200' },
  { id: 'MONTH_MASTER', emoji: '🏆', name: 'Month Master', desc: '30-day streak', color: 'bg-warning-50 border-warning-200' },
  { id: 'CENTURY', emoji: '💯', name: 'Centurion', desc: '100 active days', color: 'bg-purple-50 border-purple-200' },
  { id: 'XP_1K', emoji: '🌟', name: 'XP Legend', desc: '1000 XP earned', color: 'bg-orange-50 border-orange-200' },
  { id: 'TASK_MASTER', emoji: '✅', name: 'Task Master', desc: '50 tasks/month', color: 'bg-success-50 border-success-200' },
  { id: 'EARLY_BIRD', emoji: '🌅', name: 'Early Bird', desc: 'Log before 9am', color: 'bg-info-50 border-info-200' },
];

const TABS = [
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'alltime', label: 'All Time' },
];

const RANK_MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const globalBizId = useAppSelector((s) => s.ui.businessId);
  const { data: bizData } = useGetBusinessesQuery();
  // Fall back to any business the user belongs to (works for both owners and members)
  const firstBizId = (bizData?.businesses || [])[0]?.business._id || '';
  const effectiveBizId = globalBizId !== 'all' ? globalBizId : firstBizId;

  const [tab, setTab] = useState('weekly');
  const { data: streakData, isLoading } = useGetAllStreaksQuery(effectiveBizId, { skip: !effectiveBizId });
  const rawStreaks = (streakData?.streaks || []) as StreakEntry[];

  const ranked = useMemo(() => {
    return [...rawStreaks]
      .sort((a, b) => {
        if (tab === 'weekly') {
          const aW = a.weeklyActivity.reduce((s, d) => s + d.score, 0);
          const bW = b.weeklyActivity.reduce((s, d) => s + d.score, 0);
          return bW - aW;
        }
        if (tab === 'monthly') return b.totalActiveDays - a.totalActiveDays;
        return b.xpPoints - a.xpPoints;
      })
      .map((s, i) => {
        let score = 0;
        if (s.weeklyActivity.length > 0) {
          if (tab === 'weekly') {
            score = Math.min(100, Math.round(s.weeklyActivity.reduce((sum, d) => sum + d.score, 0) / Math.max(1, s.weeklyActivity.length)));
          } else {
            score = Math.min(100, s.weeklyActivity[s.weeklyActivity.length - 1].score);
          }
        }
        return { ...s, rank: i + 1, score };
      });
  }, [rawStreaks, tab]);

  const top3 = ranked.slice(0, 3);

  const xpChart = ranked.slice(0, 8).map((m, i) => ({
    name: m.userId.name.split(' ')[0],
    xp: m.xpPoints,
    fill: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#D97706' : '#6366F1',
  }));

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-warning-50 rounded-xl flex items-center justify-center">
            <Trophy size={18} className="text-warning-500" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-surface-900">Leaderboard</h1>
            <p className="text-sm text-surface-500">Top performers & achievements</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} variant="pill" />

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : ranked.length === 0 ? (
          <EmptyState
            icon={<Trophy size={28} />}
            title="No activity recorded yet"
            description="Team members will appear here once they start logging daily activity."
          />
        ) : (
          <>
            {/* Podium */}
            <div className="card p-6 bg-gradient-to-br from-surface-900 to-surface-800 border-0 overflow-hidden relative">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-warning-500/10 blur-3xl" />
              </div>
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Hall of Fame</p>
                  <h2 className="text-2xl font-display font-bold text-white">Top Performers</h2>
                </div>

                <div className="flex items-end justify-center gap-4 mb-6">
                  {/* 2nd place */}
                  {top3[1] && (
                    <div className="flex flex-col items-center gap-3 mb-4">
                      <Avatar name={top3[1].userId.name} size="lg" className="ring-4 ring-surface-400" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">{top3[1].userId.name.split(' ')[0]}</p>
                        <p className="text-xs text-white/40">{top3[1].score}/100</p>
                      </div>
                      <div className="w-20 h-16 bg-surface-400/20 border border-surface-400/30 rounded-t-xl flex items-end justify-center pb-2">
                        <span className="text-2xl font-bold text-surface-300">2</span>
                      </div>
                    </div>
                  )}

                  {/* 1st place */}
                  {top3[0] && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl animate-float">👑</div>
                        <Avatar name={top3[0].userId.name} size="xl" className="ring-4 ring-warning-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-white">{top3[0].userId.name.split(' ')[0]}</p>
                        <p className="text-xs text-warning-300 font-semibold">{top3[0].score}/100</p>
                      </div>
                      <div className="w-24 h-24 bg-warning-500/20 border border-warning-400/30 rounded-t-xl flex items-end justify-center pb-2">
                        <span className="text-3xl font-bold text-warning-400">1</span>
                      </div>
                    </div>
                  )}

                  {/* 3rd place */}
                  {top3[2] && (
                    <div className="flex flex-col items-center gap-3 mb-8">
                      <Avatar name={top3[2].userId.name} size="lg" className="ring-4 ring-orange-400" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">{top3[2].userId.name.split(' ')[0]}</p>
                        <p className="text-xs text-white/40">{top3[2].score}/100</p>
                      </div>
                      <div className="w-20 h-12 bg-orange-500/20 border border-orange-400/30 rounded-t-xl flex items-end justify-center pb-2">
                        <span className="text-2xl font-bold text-orange-400">3</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full rankings */}
            <div className="chart-container p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
                <h3 className="chart-title">Full Rankings</h3>
                <span className="text-xs text-surface-400">{ranked.length} members</span>
              </div>
              {ranked.map((member) => (
                <div key={member._id} className={`flex items-center gap-4 px-5 py-4 border-b border-surface-50 last:border-0 hover:bg-surface-50 transition-colors ${member.rank === 1 ? 'bg-warning-50/40' : ''}`}>
                  <div className="w-8 flex-shrink-0 text-center">
                    {member.rank <= 3
                      ? <span className="text-2xl">{RANK_MEDAL[member.rank - 1]}</span>
                      : <span className="text-sm font-bold text-surface-400">#{member.rank}</span>}
                  </div>

                  <Avatar name={member.userId.name} size="md" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-surface-900 text-sm truncate">{member.userId.name}</p>
                      <div className="level-badge text-[10px] px-2 py-0.5 hidden sm:flex">LVL {member.level}</div>
                    </div>
                    <p className="text-xs text-surface-400">
                      {tab === 'weekly' ? `${member.weeklyActivity.length}d active this week` :
                       tab === 'monthly' ? `${member.totalActiveDays} total active days` :
                       `${member.longestStreak}d best streak`}
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-1.5 text-orange-500">
                    <span>🔥</span>
                    <span className="text-sm font-bold">{member.currentStreak}</span>
                  </div>

                  <div className="hidden md:block text-center">
                    <p className="text-sm font-bold text-brand-600">{member.xpPoints.toLocaleString()}</p>
                    <p className="text-[10px] text-surface-400">XP</p>
                  </div>

                  <ScoreRing score={member.score} size={44} strokeWidth={4} />

                  <ProgressBar
                    value={member.score}
                    max={100}
                    size="xs"
                    className="w-24 hidden lg:block"
                    variant={member.score >= 80 ? 'success' : member.score >= 60 ? 'brand' : 'warning'}
                  />
                </div>
              ))}
            </div>

            {/* XP Chart */}
            {xpChart.length > 0 && (
              <div className="chart-container">
                <h3 className="chart-title mb-1">XP Points</h3>
                <p className="chart-subtitle mb-4">Total experience points earned</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={xpChart} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [`${v} XP`, 'Points']} />
                    <Bar dataKey="xp" name="XP" radius={[8, 8, 0, 0]}>
                      {xpChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {/* Badges showcase */}
        <div>
          <h3 className="text-lg font-display font-bold text-surface-900 mb-4">Achievement Badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {BADGE_DEFINITIONS.map((badge) => (
              <div key={badge.id} className={`card p-3 text-center border ${badge.color}`}>
                <div className="text-3xl mb-2 animate-float">{badge.emoji}</div>
                <p className="text-xs font-bold text-surface-800 mb-0.5">{badge.name}</p>
                <p className="text-[10px] text-surface-500">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
