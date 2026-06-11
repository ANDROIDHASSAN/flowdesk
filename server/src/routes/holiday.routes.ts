import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { requireMembership, requireOwnership } from '../middleware/scope';
import { asyncHandler } from '../utils/errors';
import { Holiday } from '../models/Holiday';
import { EmployeeProfile } from '../models/EmployeeProfile';
import { Membership } from '../models/Membership';

const router = Router();
router.use(requireAuth);

// GET /api/holidays?businessId=xxx&year=2024
router.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId, year } = req.query as { businessId: string; year: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireMembership(req.userId!, businessId);

  const yearNum = parseInt(year || new Date().getFullYear().toString());

  const stored = await Holiday.find({
    businessId,
    date: { $gte: `${yearNum}-01-01`, $lte: `${yearNum}-12-31` },
  }).populate('employeeId', 'name').lean();

  const profiles = await EmployeeProfile.find({ businessId, birthday: { $exists: true, $ne: null } })
    .populate('userId', 'name').lean();

  const birthdays = profiles
    .filter(p => p.birthday)
    .map(p => {
      const bday = p.birthday!;
      const monthDay = bday.substring(5);
      return {
        _id: `birthday_${p.userId}`,
        businessId,
        name: `🎂 ${(p.userId as unknown as { name: string }).name}'s Birthday`,
        date: `${yearNum}-${monthDay}`,
        type: 'BIRTHDAY',
        isRecurring: true,
        employeeId: p.userId,
        color: '#F97316',
      };
    });

  res.json({ holidays: [...stored, ...birthdays] });
}));

// POST /api/holidays
router.post('/', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);

  const holiday = await Holiday.create(req.body);
  res.status(201).json({ holiday });
}));

// PATCH /api/holidays/:id
router.patch('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);

  const holiday = await Holiday.findOneAndUpdate(
    { _id: req.params.id, businessId },
    { $set: req.body },
    { new: true }
  );
  if (!holiday) return res.status(404).json({ error: 'Holiday not found' });
  res.json({ holiday });
}));

// DELETE /api/holidays/:id
router.delete('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.query as { businessId: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);

  await Holiday.findOneAndDelete({ _id: req.params.id, businessId });
  res.json({ ok: true });
}));

// POST /api/holidays/bulk-defaults
router.post('/bulk-defaults', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId, year } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);

  const y = year || new Date().getFullYear();
  const defaults = [
    { name: "New Year's Day", date: `${y}-01-01`, type: 'PUBLIC', color: '#6366F1' },
    { name: 'Republic Day', date: `${y}-01-26`, type: 'PUBLIC', color: '#3B82F6' },
    { name: 'Holi', date: `${y}-03-25`, type: 'PUBLIC', color: '#F97316' },
    { name: 'Good Friday', date: `${y}-04-18`, type: 'PUBLIC', color: '#8B5CF6' },
    { name: 'Independence Day', date: `${y}-08-15`, type: 'PUBLIC', color: '#10B981' },
    { name: 'Gandhi Jayanti', date: `${y}-10-02`, type: 'PUBLIC', color: '#F59E0B' },
    { name: 'Dussehra', date: `${y}-10-02`, type: 'PUBLIC', color: '#F97316' },
    { name: 'Diwali', date: `${y}-10-20`, type: 'PUBLIC', color: '#F59E0B' },
    { name: 'Christmas', date: `${y}-12-25`, type: 'PUBLIC', color: '#10B981' },
  ].map(h => ({ ...h, businessId, isRecurring: true }));

  await Holiday.insertMany(defaults, { ordered: false });
  res.json({ ok: true, count: defaults.length });
}));

export default router;
