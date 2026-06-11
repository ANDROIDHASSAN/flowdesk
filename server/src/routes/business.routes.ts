import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { requireOwnership } from '../middleware/scope';
import { Business } from '../models/Business';
import { Membership } from '../models/Membership';
import { asyncHandler, badRequest } from '../utils/errors';

const router = Router();
router.use(requireAuth);

/** All businesses I belong to, with my role — drives the business switcher */
router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const memberships = await Membership.find({ userId: req.userId })
      .populate('businessId', 'name ownerId')
      .sort({ createdAt: 1 })
      .lean();
    res.json({
      businesses: memberships
        .filter((m) => m.businessId)
        .map((m) => ({
          membershipId: m._id,
          business: m.businessId,
          role: m.role,
          displayName: m.displayName,
        })),
    });
  })
);

/** Create a business — caller becomes its OWNER */
router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) throw badRequest('Business name is required');
    const business = await Business.create({ name: name.trim(), ownerId: req.userId });
    const { User } = await import('../models/User');
    const user = await User.findById(req.userId);
    await Membership.create({
      businessId: business._id,
      userId: req.userId,
      role: 'OWNER',
      displayName: user?.name || 'Owner',
    });
    res.status(201).json({ business });
  })
);

/** Members of one business (owner only) */
router.get(
  '/:id/members',
  asyncHandler(async (req: AuthedRequest, res) => {
    await requireOwnership(req.userId!, req.params.id);
    const members = await Membership.find({ businessId: req.params.id })
      .populate('userId', 'name email')
      .sort({ role: 1, createdAt: 1 })
      .lean();
    res.json({ members });
  })
);

export default router;
