import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { requireMembership } from '../middleware/scope';
import { asyncHandler } from '../utils/errors';
import { Streak } from '../models/Streak';
import { PerformanceScore } from '../models/PerformanceScore';
import { istToday } from '../utils/dates';

const router = Router();
router.use(requireAuth);

function calcLevel(xp: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) return i + 1;
  }
  return 1;
}

// GET /api/streaks?businessId=xxx
router.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.query as { businessId: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireMembership(req.userId!, businessId);
  const streaks = await Streak.find({ businessId }).populate('userId', 'name email').lean();
  res.json({ streaks });
}));

// GET /api/streaks/me?businessId=xxx
router.get('/me', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.query as { businessId: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireMembership(req.userId!, businessId);
  const streak = await Streak.findOne({ businessId, userId: req.userId }).lean();
  res.json({ streak: streak || { currentStreak: 0, longestStreak: 0, xpPoints: 0, level: 1, badges: [], totalActiveDays: 0 } });
}));

// POST /api/streaks/record
router.post('/record', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireMembership(req.userId!, businessId);

  const today = istToday();
  let streak = await Streak.findOne({ businessId, userId: req.userId });

  if (!streak) {
    streak = new Streak({ businessId, userId: req.userId });
  }

  if (streak.lastActivityDate === today) {
    return res.json({ streak, alreadyRecorded: true });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];

  const wasYesterday = streak.lastActivityDate === yStr;
  const newCurrent = wasYesterday ? streak.currentStreak + 1 : 1;
  const xpGain = 10 + Math.min(newCurrent * 2, 20);

  const perf = await PerformanceScore.findOne({ businessId, userId: req.userId, date: today }).lean();
  const perfBonus = perf ? Math.floor(perf.score / 10) : 0;
  const totalXpGain = xpGain + perfBonus;

  streak.lastActivityDate = today;
  streak.currentStreak = newCurrent;
  streak.longestStreak = Math.max(streak.longestStreak, newCurrent);
  streak.totalActiveDays += 1;
  streak.xpPoints += totalXpGain;
  streak.level = calcLevel(streak.xpPoints);

  const badges = new Set(streak.badges);
  if (newCurrent >= 7 && !badges.has('WEEK_WARRIOR')) badges.add('WEEK_WARRIOR');
  if (newCurrent >= 30 && !badges.has('MONTH_MASTER')) badges.add('MONTH_MASTER');
  if (streak.totalActiveDays >= 100 && !badges.has('CENTURY')) badges.add('CENTURY');
  if (streak.xpPoints >= 1000 && !badges.has('XP_1K')) badges.add('XP_1K');
  streak.badges = Array.from(badges);

  const week = streak.weeklyActivity.filter((w: { date: string }) => {
    const d = new Date(w.date);
    const now = new Date();
    return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  });
  week.push({ date: today, score: perf?.score || 50 });
  streak.weeklyActivity = week.slice(-7);

  await streak.save();
  res.json({ streak, xpGained: totalXpGain });
}));

export default router;
