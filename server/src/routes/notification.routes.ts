import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { Notification } from '../models/Notification';
import { asyncHandler } from '../utils/errors';

const router = Router();
router.use(requireAuth);

/** Latest notifications for the caller + unread count (drives the bell) */
router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const [items, unread] = await Promise.all([
      Notification.find({ userId: req.userId })
        .populate('businessId', 'name')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Notification.countDocuments({ userId: req.userId, read: false }),
    ]);
    res.json({ items, unread });
  })
);

/** Mark specific notifications (or all) as read */
router.post(
  '/read',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { ids, all } = req.body as { ids?: string[]; all?: boolean };
    const filter: Record<string, unknown> = { userId: req.userId, read: false };
    if (!all && Array.isArray(ids)) filter._id = { $in: ids };
    await Notification.updateMany(filter, { $set: { read: true } });
    res.json({ ok: true });
  })
);

export default router;
