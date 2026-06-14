import { connectDB, isUsingMemoryDB } from './config/db';
import { env } from './config/env';
import { startInternalCron } from './cron';
import app from './app';

async function autoSeed() {
  const { User } = await import('./models/User');
  if (await User.countDocuments() > 0) return;

  console.log('[server] Empty DB — seeding demo accounts...');
  const bcrypt = (await import('bcryptjs')).default;
  const { Business } = await import('./models/Business');
  const { Membership } = await import('./models/Membership');

  const hash = await bcrypt.hash('pulse1234', 10);
  const [owner, priya, rahul, sana, vikram, meera] = await User.insertMany([
    { name: 'Arjun Mehta',   email: 'owner@pulse.demo',  passwordHash: hash },
    { name: 'Priya Sharma',  email: 'priya@pulse.demo',  passwordHash: hash },
    { name: 'Rahul Verma',   email: 'rahul@pulse.demo',  passwordHash: hash },
    { name: 'Sana Khan',     email: 'sana@pulse.demo',   passwordHash: hash },
    { name: 'Vikram Singh',  email: 'vikram@pulse.demo', passwordHash: hash },
    { name: 'Meera Nair',    email: 'meera@pulse.demo',  passwordHash: hash },
  ]);

  const biz1 = await Business.create({ name: 'Mehta Digital Agency', ownerId: owner._id });
  const biz2 = await Business.create({ name: 'Dukaan Exports',       ownerId: owner._id });

  await Membership.insertMany([
    { userId: owner._id,  businessId: biz1._id, role: 'OWNER',  displayName: 'Arjun Mehta'  },
    { userId: priya._id,  businessId: biz1._id, role: 'MEMBER', displayName: 'Priya Sharma' },
    { userId: rahul._id,  businessId: biz1._id, role: 'MEMBER', displayName: 'Rahul Verma'  },
    { userId: sana._id,   businessId: biz1._id, role: 'MEMBER', displayName: 'Sana Khan'    },
    { userId: vikram._id, businessId: biz1._id, role: 'MEMBER', displayName: 'Vikram Singh' },
    { userId: meera._id,  businessId: biz1._id, role: 'MEMBER', displayName: 'Meera Nair'   },
    { userId: owner._id,  businessId: biz2._id, role: 'OWNER',  displayName: 'Arjun Mehta'  },
    { userId: vikram._id, businessId: biz2._id, role: 'MEMBER', displayName: 'Vikram Singh' },
    { userId: meera._id,  businessId: biz2._id, role: 'MEMBER', displayName: 'Meera Nair'   },
  ]);

  console.log('[server] ✅ Demo accounts ready');
  console.log('[server]    owner@pulse.demo  / pulse1234  (Owner)');
  console.log('[server]    priya@pulse.demo  / pulse1234  (Member)');
  console.log('[server]    Run "npm run seed" in /server for full demo data');
}

async function main() {
  await connectDB();
  if (isUsingMemoryDB()) await autoSeed();
  if (env.ENABLE_INTERNAL_CRON) startInternalCron();
  app.listen(env.PORT, () => console.log(`[server] FlowDesk API on http://localhost:${env.PORT}`));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
