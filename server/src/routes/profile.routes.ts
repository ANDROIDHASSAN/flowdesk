import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { requireMembership, requireOwnership } from '../middleware/scope';
import { asyncHandler } from '../utils/errors';
import { EmployeeProfile } from '../models/EmployeeProfile';
import { User } from '../models/User';
import { Membership } from '../models/Membership';

const router = Router();
router.use(requireAuth);

// GET /api/profiles?businessId=xxx
router.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.query as { businessId: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);

  const members = await Membership.find({ businessId }).populate('userId', 'name email').lean();
  const profiles = await EmployeeProfile.find({ businessId }).lean();

  const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));
  const result = members.map(m => ({
    ...m,
    profile: profileMap.get((m.userId as { _id?: unknown })._id?.toString() || m.userId.toString()) || null,
  }));

  res.json({ members: result });
}));

// GET /api/profiles/me?businessId=xxx
router.get('/me', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.query as { businessId: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireMembership(req.userId!, businessId);
  const profile = await EmployeeProfile.findOne({ businessId, userId: req.userId }).lean();
  res.json({ profile });
}));

// GET /api/profiles/:userId?businessId=xxx
router.get('/:userId', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.query as { businessId: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);
  const profile = await EmployeeProfile.findOne({ businessId, userId: req.params.userId }).lean();
  const user = await User.findById(req.params.userId, 'name email').lean();
  res.json({ profile, user });
}));

// PUT /api/profiles/me
router.put('/me', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId, ...data } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireMembership(req.userId!, businessId);

  const profile = await EmployeeProfile.findOneAndUpdate(
    { businessId, userId: req.userId },
    { $set: data },
    { new: true, upsert: true }
  );
  res.json({ profile });
}));

// PATCH /api/profiles/:userId
router.patch('/:userId', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireOwnership(req.userId!, businessId);

  const profile = await EmployeeProfile.findOneAndUpdate(
    { businessId, userId: req.params.userId },
    { $set: req.body },
    { new: true, upsert: true }
  );
  res.json({ profile });
}));

export default router;
