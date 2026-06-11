/**
 * Development helper: boots in-memory MongoDB + app + seeds demo data
 * This ensures the app is fully populated and ready to test immediately
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function main() {
  console.log('🚀 Starting dev environment with seeded data...');

  // Boot in-memory MongoDB
  const mem = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mem.getUri('pulsecrm');
  process.env.JWT_SECRET = 'dev-secret';
  process.env.SERVICE_TOKEN = 'dev-service-token';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.PORT = '4000';
  process.env.ENABLE_INTERNAL_CRON = 'true';
  process.env.RESEND_API_KEY = '';

  console.log('📦 Connecting to in-memory MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);

  // Import models
  const { User } = await import('../src/models/User');
  const { Business } = await import('../src/models/Business');
  const { Membership } = await import('../src/models/Membership');
  const { Task } = await import('../src/models/Task');
  const { TimeEntry } = await import('../src/models/TimeEntry');
  const { DailyLog } = await import('../src/models/DailyLog');
  const { FollowUp } = await import('../src/models/FollowUp');
  const { Notification } = await import('../src/models/Notification');

  // Clear collections
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

  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 5.5 * 3600_000 + 86400_000).toISOString().slice(0, 10);

  await Task.create([
    { businessId: agency._id, assigneeId: priya._id, title: 'Landing page redesign for Khanna Jewellers', status: 'IN_PROGRESS', priority: 'HIGH', dueAt: new Date(Date.now() + 30 * 3600_000) },
    { businessId: agency._id, assigneeId: rahul._id, title: 'Send proposal to Gupta Textiles', status: 'TODO', priority: 'HIGH', dueAt: new Date(Date.now() - 20 * 3600_000) }, // overdue
    { businessId: dukaan._id, assigneeId: sana._id, title: 'Customs paperwork — Dubai shipment', status: 'IN_PROGRESS', priority: 'HIGH', dueAt: new Date(Date.now() + 8 * 3600_000) },
  ]);

  await FollowUp.create([
    { businessId: agency._id, userId: rahul._id, clientName: 'Khanna Jewellers', note: 'Discuss phase-2 budget', dueAt: new Date(Date.now() + 6 * 3600_000), status: 'PENDING' },
    { businessId: agency._id, userId: rahul._id, clientName: 'Gupta Textiles', note: 'Proposal follow-up call', dueAt: new Date(Date.now() - 30 * 3600_000), status: 'OVERDUE' },
    { businessId: dukaan._id, userId: sana._id, clientName: 'Al-Noor Trading (Dubai)', note: 'Confirm container booking', dueAt: new Date(Date.now() + 4 * 3600_000), status: 'PENDING' },
  ]);

  await TimeEntry.create([
    { businessId: agency._id, userId: priya._id, date: today, minutes: 150, note: 'Landing page hero + sections', source: 'TIMER' },
    { businessId: agency._id, userId: rahul._id, date: today, minutes: 90, note: 'Client calls', source: 'MANUAL' },
    { businessId: dukaan._id, userId: sana._id, date: today, minutes: 200, note: 'Shipment docs', source: 'MANUAL' },
  ]);

  await DailyLog.create([
    { businessId: agency._id, userId: priya._id, date: today, summary: 'Finished wireframes for Khanna Jewellers; shared with Arjun for review.' },
    { businessId: dukaan._id, userId: sana._id, date: today, summary: 'Dubai shipment docs 80% done, customs broker call scheduled tomorrow 11am.' },
  ]);

  console.log('✅ Demo data seeded');
  console.log('\n📝 Login with:');
  console.log('   Owner: owner@pulse.demo / pulse1234');
  console.log('   Members: priya@pulse.demo, rahul@pulse.demo, sana@pulse.demo / pulse1234\n');

  // Start the Express app
  console.log('🎯 Booting Pulse CRM API...');
  await import('../src/index');

  // Keep alive
  console.log('\n✨ Dev environment ready! Visit http://localhost:5173');
}

main().catch((err) => {
  console.error('❌ Dev setup failed:', err.message);
  process.exit(1);
});
