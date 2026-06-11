import crypto from 'crypto';
import { Router } from 'express';
import { env } from '../config/env';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { requireOwnership } from '../middleware/scope';
import { Business } from '../models/Business';
import { Invite } from '../models/Invite';
import { Membership } from '../models/Membership';
import { User } from '../models/User';
import { emailShell, sendEmail } from '../services/email';
import { asyncHandler, badRequest, forbidden, notFound } from '../utils/errors';

const router = Router();
router.use(requireAuth);

/** Owner invites a member by email. Existing users join instantly; new ones get a signup link. */
router.post(
  '/invite',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { businessId, email, displayName } = req.body as {
      businessId?: string;
      email?: string;
      displayName?: string;
    };
    if (!businessId || !email?.trim()) throw badRequest('businessId and email are required');
    await requireOwnership(req.userId!, businessId);

    const business = await Business.findById(businessId);
    if (!business) throw notFound('Business not found');
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const already = await Membership.findOne({ businessId, userId: existingUser._id });
      if (already) throw badRequest('This person is already a member of this business');
      await Membership.create({
        businessId,
        userId: existingUser._id,
        role: 'MEMBER',
        displayName: displayName?.trim() || existingUser.name,
      });
      await sendEmail(
        cleanEmail,
        `You've been added to ${business.name} on Pulse CRM`,
        emailShell(
          `Welcome to ${business.name}`,
          `<p>Hi ${existingUser.name}, you've been added to <b>${business.name}</b>. Log in to see your tasks and follow-ups.</p>`
        )
      );
      return res.json({ joined: true, message: `${existingUser.name} added to ${business.name}` });
    }

    const token = crypto.randomBytes(24).toString('hex');
    await Invite.create({
      businessId,
      email: cleanEmail,
      displayName: displayName?.trim(),
      token,
      invitedBy: req.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    const link = `${env.CLIENT_URL}/accept-invite?token=${token}`;
    await sendEmail(
      cleanEmail,
      `Invitation to join ${business.name} on Pulse CRM`,
      emailShell(
        `Join ${business.name}`,
        `<p>You've been invited to join <b>${business.name}</b> on Pulse CRM.</p><p><a href="${link}">Click here to create your account</a> (link valid for 7 days).</p>`
      )
    );
    res.json({ joined: false, message: `Invite sent to ${cleanEmail}`, inviteLink: link });
  })
);

/** Pending invites for a business (owner only) */
router.get(
  '/invites',
  asyncHandler(async (req: AuthedRequest, res) => {
    const businessId = String(req.query.businessId || '');
    await requireOwnership(req.userId!, businessId);
    const invites = await Invite.find({ businessId, acceptedAt: null, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ invites });
  })
);

/** Logged-in user accepts an invite link */
router.post(
  '/accept-invite',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { token } = req.body as { token?: string };
    if (!token) throw badRequest('token is required');
    const invite = await Invite.findOne({ token, acceptedAt: null, expiresAt: { $gt: new Date() } });
    if (!invite) throw badRequest('Invite link is invalid or has expired');
    const user = await User.findById(req.userId);
    if (!user) throw forbidden();
    if (invite.email !== user.email) throw badRequest('This invite was sent to a different email address');

    const exists = await Membership.findOne({ businessId: invite.businessId, userId: user._id });
    if (!exists) {
      await Membership.create({
        businessId: invite.businessId,
        userId: user._id,
        role: 'MEMBER',
        displayName: invite.displayName || user.name,
      });
    }
    invite.acceptedAt = new Date();
    await invite.save();
    res.json({ ok: true });
  })
);

/** Owner removes a member (never the owner row itself) */
router.delete(
  '/:membershipId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const membership = await Membership.findById(req.params.membershipId);
    if (!membership) throw notFound('Membership not found');
    await requireOwnership(req.userId!, String(membership.businessId));
    if (membership.role === 'OWNER') throw badRequest('Cannot remove the business owner');
    await membership.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
