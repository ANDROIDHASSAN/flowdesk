import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { AuthedRequest, requireAuth, signToken } from '../middleware/auth';
import { Invite } from '../models/Invite';
import { Membership } from '../models/Membership';
import { User } from '../models/User';
import { asyncHandler, badRequest, unauthorized } from '../utils/errors';

const router = Router();

function publicUser(u: { _id: unknown; name: string; email: string }) {
  return { _id: u._id, name: u.name, email: u.email };
}

/** Accept a pending invite for this user+email, if the token is valid */
async function consumeInvite(token: string, userId: unknown, email: string, fallbackName: string) {
  const invite = await Invite.findOne({ token, acceptedAt: null, expiresAt: { $gt: new Date() } });
  if (!invite) throw badRequest('Invite link is invalid or has expired');
  if (invite.email !== email.toLowerCase()) {
    throw badRequest('This invite was sent to a different email address');
  }
  const exists = await Membership.findOne({ businessId: invite.businessId, userId });
  if (!exists) {
    await Membership.create({
      businessId: invite.businessId,
      userId,
      role: 'MEMBER',
      displayName: invite.displayName || fallbackName,
    });
  }
  invite.acceptedAt = new Date();
  await invite.save();
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, inviteToken } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      inviteToken?: string;
    };
    if (!name?.trim() || !email?.trim() || !password) throw badRequest('name, email and password are required');
    if (password.length < 8) throw badRequest('Password must be at least 8 characters');

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw badRequest('An account with this email already exists — please log in');

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
    });

    if (inviteToken) await consumeInvite(inviteToken, user._id, user.email, user.name);

    res.json({ token: signToken(String(user._id)), user: publicUser(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) throw badRequest('email and password are required');
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw unauthorized('Incorrect email or password');
    }
    res.json({ token: signToken(String(user._id)), user: publicUser(user) });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw unauthorized();
    res.json({ user: publicUser(user) });
  })
);

export default router;
