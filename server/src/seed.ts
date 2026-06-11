/**
 * Demo seed: one owner with two businesses, three members, and realistic
 * tasks / time entries / follow-ups / daily logs.
 *
 *   npm run seed
 *
 * Owner login:   owner@pulse.demo / pulse1234
 * Member logins: priya@pulse.demo, rahul@pulse.demo, sana@pulse.demo / pulse1234
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { Business } from './models/Business';
import { DailyLog } from './models/DailyLog';
import { FollowUp } from './models/FollowUp';
import { Membership } from './models/Membership';
import { Notification } from './models/Notification';
import { Task } from './models/Task';
import { TimeEntry } from './models/TimeEntry';
import { User } from './models/User';
import { istToday, shiftDate } from './utils/dates';

async function main() {
  await connectDB();
  console.log('Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Business.deleteMany({}),
    Membership.deleteMany({}),
    Task.deleteMany({}),
    TimeEntry.deleteMany({}),
    DailyLog.deleteMany({}),
    FollowUp.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const hash = await bcrypt.hash('pulse1234', 10);
  const [owner, priya, rahul, sana] = await User.create([
    { name: 'Arjun Mehta', email: 'owner@pulse.demo', passwordHash: hash },
    { name: 'Priya Sharma', email: 'priya@pulse.demo', passwordHash: hash },
    { name: 'Rahul Verma', email: 'rahul@pulse.demo', passwordHash: hash },
    { name: 'Sana Khan', email: 'sana@pulse.demo', passwordHash: hash },
  ]);

  const [agency, dukaan] = await Business.create([
    { name: 'Mehta Digital Agency', ownerId: owner._id },
    { name: 'Dukaan Exports', ownerId: owner._id },
  ]);

  await Membership.create([
    { businessId: agency._id, userId: owner._id, role: 'OWNER', displayName: 'Arjun (Boss)' },
    { businessId: agency._id, userId: priya._id, role: 'MEMBER', displayName: 'Priya — Design' },
    { businessId: agency._id, userId: rahul._id, role: 'MEMBER', displayName: 'Rahul — Sales' },
    { businessId: dukaan._id, userId: owner._id, role: 'OWNER', displayName: 'Arjun (Boss)' },
    { businessId: dukaan._id, userId: sana._id, role: 'MEMBER', displayName: 'Sana — Ops' },
    { businessId: dukaan._id, userId: rahul._id, role: 'MEMBER', displayName: 'Rahul — Sales' },
  ]);

  const today = istToday();
  const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000);

  await Task.create([
    { businessId: agency._id, assigneeId: priya._id, title: 'Landing page redesign for Khanna Jewellers', status: 'IN_PROGRESS', priority: 'HIGH', dueAt: hoursFromNow(30) },
    { businessId: agency._id, assigneeId: priya._id, title: 'Instagram creatives — Diwali campaign', status: 'TODO', priority: 'MED', dueAt: hoursFromNow(72) },
    { businessId: agency._id, assigneeId: rahul._id, title: 'Send proposal to Gupta Textiles', status: 'TODO', priority: 'HIGH', dueAt: hoursFromNow(-20) }, // overdue
    { businessId: agency._id, assigneeId: rahul._id, title: 'Close Q2 invoices', status: 'DONE', priority: 'MED', completedAt: new Date(), confirmedByOwner: false },
    { businessId: dukaan._id, assigneeId: sana._id, title: 'Customs paperwork — Dubai shipment', status: 'IN_PROGRESS', priority: 'HIGH', dueAt: hoursFromNow(8) },
    { businessId: dukaan._id, assigneeId: sana._id, title: 'Update inventory sheet', status: 'DONE', priority: 'LOW', completedAt: new Date(), confirmedByOwner: true },
  ]);

  await FollowUp.create([
    { businessId: agency._id, userId: rahul._id, clientName: 'Khanna Jewellers', contact: '+91 98xxxxxx01', note: 'Discuss phase-2 budget', dueAt: hoursFromNow(6), status: 'PENDING' },
    { businessId: agency._id, userId: rahul._id, clientName: 'Gupta Textiles', contact: '+91 98xxxxxx02', note: 'Proposal follow-up call', dueAt: hoursFromNow(-30), status: 'OVERDUE' },
    { businessId: agency._id, userId: priya._id, clientName: 'Cafe Andaaz', note: 'Logo feedback round 2', dueAt: hoursFromNow(50), status: 'PENDING' },
    { businessId: dukaan._id, userId: sana._id, clientName: 'Al-Noor Trading (Dubai)', contact: 'alnoor@example.ae', note: 'Confirm container booking', dueAt: hoursFromNow(4), status: 'PENDING' },
    { businessId: dukaan._id, userId: rahul._id, clientName: 'Meridian Imports', note: 'Payment reminder — ₹2.4L pending', dueAt: hoursFromNow(-5), status: 'PENDING' }, // will flip OVERDUE
  ]);

  const days = [0, -1, -2, -3, -4].map((d) => shiftDate(today, d));
  await TimeEntry.create([
    { businessId: agency._id, userId: priya._id, date: days[0], minutes: 150, note: 'Landing page hero + sections', source: 'TIMER' },
    { businessId: agency._id, userId: priya._id, date: days[1], minutes: 380, note: 'Wireframes', source: 'MANUAL' },
    { businessId: agency._id, userId: rahul._id, date: days[1], minutes: 240, note: 'Client calls', source: 'MANUAL' },
    { businessId: dukaan._id, userId: sana._id, date: days[0], minutes: 200, note: 'Shipment docs', source: 'MANUAL' },
    { businessId: dukaan._id, userId: sana._id, date: days[2], minutes: 410, note: 'Inventory + supplier calls', source: 'MANUAL' },
  ]);

  await DailyLog.create([
    { businessId: agency._id, userId: priya._id, date: days[1], summary: 'Finished wireframes for Khanna Jewellers; shared with Arjun for review.' },
    { businessId: dukaan._id, userId: sana._id, date: days[0], summary: 'Dubai shipment docs 80% done, customs broker call scheduled tomorrow 11am.' },
    { businessId: agency._id, userId: rahul._id, date: days[2], summary: '4 client calls, Gupta Textiles asked for revised quote.' },
  ]);

  console.log('✅ Seed complete.');
  console.log('   Owner : owner@pulse.demo / pulse1234');
  console.log('   Members: priya@pulse.demo, rahul@pulse.demo, sana@pulse.demo / pulse1234');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
