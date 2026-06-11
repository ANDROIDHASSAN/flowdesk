import { Types } from 'mongoose';
import { IMembership, Membership, Role } from '../models/Membership';
import { badRequest, forbidden } from '../utils/errors';

/**
 * Multi-tenant guard helpers. EVERY scoped query must pass through one of these —
 * a businessId from the client is never trusted without checking the caller's
 * membership in that business.
 */

export async function getMembership(userId: string, businessId: string): Promise<IMembership | null> {
  if (!Types.ObjectId.isValid(businessId)) return null;
  return Membership.findOne({ userId, businessId }).lean<IMembership>();
}

export interface Scope {
  /** businesses this request is allowed to touch */
  businessIds: Types.ObjectId[];
  /** role of the caller in the (single) requested business; 'OWNER' for owner-only multi scopes */
  role: Role;
}

/**
 * Resolve `businessId` (a specific id, or 'all') into the set of business ids the
 * caller may access. With ownerOnly=true, only businesses where the caller is OWNER.
 */
export async function resolveScope(
  userId: string,
  businessIdParam: string | undefined,
  opts: { ownerOnly?: boolean } = {}
): Promise<Scope> {
  if (!businessIdParam || businessIdParam === 'all') {
    const filter: Record<string, unknown> = { userId };
    if (opts.ownerOnly) filter.role = 'OWNER';
    const memberships = await Membership.find(filter).lean<IMembership[]>();
    if (opts.ownerOnly && memberships.length === 0) throw forbidden('Not an owner of any business');
    return {
      businessIds: memberships.map((m) => m.businessId),
      role: opts.ownerOnly ? 'OWNER' : 'MEMBER',
    };
  }
  const membership = await getMembership(userId, businessIdParam);
  if (!membership) throw forbidden('You are not a member of this business');
  if (opts.ownerOnly && membership.role !== 'OWNER') throw forbidden('Owner access required');
  return { businessIds: [membership.businessId], role: membership.role };
}

/** Strict single-business membership check (for create/update payloads) */
export async function requireMembership(userId: string, businessId: string): Promise<IMembership> {
  if (!businessId) throw badRequest('businessId is required');
  const m = await getMembership(userId, businessId);
  if (!m) throw forbidden('You are not a member of this business');
  return m;
}

export async function requireOwnership(userId: string, businessId: string): Promise<IMembership> {
  const m = await requireMembership(userId, businessId);
  if (m.role !== 'OWNER') throw forbidden('Owner access required');
  return m;
}
