/**
 * Full demo seed — covers every model in the app.
 *
 *   npm run seed
 *
 * Owner  : owner@pulse.demo  / pulse1234
 * Members: priya@pulse.demo, rahul@pulse.demo, sana@pulse.demo,
 *          vikram@pulse.demo, meera@pulse.demo  / pulse1234
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { Business } from './models/Business';
import { DailyLog } from './models/DailyLog';
import { EmployeeProfile } from './models/EmployeeProfile';
import { Flashcard } from './models/Flashcard';
import { FollowUp } from './models/FollowUp';
import { Holiday } from './models/Holiday';
import { Membership } from './models/Membership';
import { Notification } from './models/Notification';
import { Payment } from './models/Payment';
import { PerformanceScore } from './models/PerformanceScore';
import { Project } from './models/Project';
import { Streak } from './models/Streak';
import { Task } from './models/Task';
import { TimeEntry } from './models/TimeEntry';
import { User } from './models/User';
import { istToday, shiftDate } from './utils/dates';

const hr = (h: number) => new Date(Date.now() + h * 3_600_000);
const day = (d: number) => new Date(Date.now() + d * 86_400_000);

async function main() {
  await connectDB();
  console.log('🗑  Clearing existing data…');

  await Promise.all([
    User.deleteMany({}),
    Business.deleteMany({}),
    Membership.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    TimeEntry.deleteMany({}),
    DailyLog.deleteMany({}),
    FollowUp.deleteMany({}),
    Notification.deleteMany({}),
    PerformanceScore.deleteMany({}),
    Streak.deleteMany({}),
    Payment.deleteMany({}),
    EmployeeProfile.deleteMany({}),
    Flashcard.deleteMany({}),
    Holiday.deleteMany({}),
  ]);

  // ── Users ────────────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('pulse1234', 10);
  const [owner, priya, rahul, sana, vikram, meera] = await User.create([
    { name: 'Arjun Mehta',   email: 'owner@pulse.demo',  passwordHash: hash },
    { name: 'Priya Sharma',  email: 'priya@pulse.demo',  passwordHash: hash },
    { name: 'Rahul Verma',   email: 'rahul@pulse.demo',  passwordHash: hash },
    { name: 'Sana Khan',     email: 'sana@pulse.demo',   passwordHash: hash },
    { name: 'Vikram Singh',  email: 'vikram@pulse.demo', passwordHash: hash },
    { name: 'Meera Nair',    email: 'meera@pulse.demo',  passwordHash: hash },
  ]);

  // ── Businesses ───────────────────────────────────────────────────────────────
  const [agency, exports_biz] = await Business.create([
    { name: 'Mehta Digital Agency', ownerId: owner._id },
    { name: 'Dukaan Exports',       ownerId: owner._id },
  ]);

  // ── Memberships ──────────────────────────────────────────────────────────────
  await Membership.create([
    { businessId: agency._id,      userId: owner._id,  role: 'OWNER',  displayName: 'Arjun (Boss)' },
    { businessId: agency._id,      userId: priya._id,  role: 'MEMBER', displayName: 'Priya — Design' },
    { businessId: agency._id,      userId: rahul._id,  role: 'MEMBER', displayName: 'Rahul — Sales' },
    { businessId: agency._id,      userId: vikram._id, role: 'MEMBER', displayName: 'Vikram — Dev' },
    { businessId: agency._id,      userId: meera._id,  role: 'MEMBER', displayName: 'Meera — Content' },
    { businessId: exports_biz._id, userId: owner._id,  role: 'OWNER',  displayName: 'Arjun (Boss)' },
    { businessId: exports_biz._id, userId: sana._id,   role: 'MEMBER', displayName: 'Sana — Ops' },
    { businessId: exports_biz._id, userId: rahul._id,  role: 'MEMBER', displayName: 'Rahul — Sales' },
  ]);

  // ── Employee Profiles ─────────────────────────────────────────────────────────
  const today = istToday();
  await EmployeeProfile.create([
    {
      userId: priya._id, businessId: agency._id,
      phone: '+91 98201 11111', department: 'Design', designation: 'Sr. UI/UX Designer',
      skills: ['Figma', 'Adobe XD', 'Illustrator', 'Motion Design'],
      salary: 75000, salaryType: 'MONTHLY', currency: 'INR',
      joiningDate: shiftDate(today, -400), birthday: '1997-03-15',
      vacationDays: 24, vacationUsed: 6, bio: 'Creative designer with 5 years of experience in brand & digital.',
    },
    {
      userId: rahul._id, businessId: agency._id,
      phone: '+91 98202 22222', department: 'Sales', designation: 'Business Development Manager',
      skills: ['CRM', 'Cold Calling', 'Proposals', 'Negotiation'],
      salary: 65000, salaryType: 'MONTHLY', currency: 'INR',
      joiningDate: shiftDate(today, -300), birthday: '1995-07-22',
      vacationDays: 24, vacationUsed: 3, bio: 'Revenue-focused BDM closing ₹40L+ deals per quarter.',
    },
    {
      userId: vikram._id, businessId: agency._id,
      phone: '+91 98203 33333', department: 'Engineering', designation: 'Full Stack Developer',
      skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
      salary: 90000, salaryType: 'MONTHLY', currency: 'INR',
      joiningDate: shiftDate(today, -200), birthday: '1996-11-08',
      vacationDays: 24, vacationUsed: 2, bio: 'MERN stack developer obsessed with clean code and performance.',
    },
    {
      userId: meera._id, businessId: agency._id,
      phone: '+91 98204 44444', department: 'Marketing', designation: 'Content Strategist',
      skills: ['Copywriting', 'SEO', 'Social Media', 'Email Marketing'],
      salary: 55000, salaryType: 'MONTHLY', currency: 'INR',
      joiningDate: shiftDate(today, -150), birthday: '1998-05-30',
      vacationDays: 24, vacationUsed: 0, bio: 'Content-first marketer who turns ideas into campaigns that convert.',
    },
    {
      userId: sana._id, businessId: exports_biz._id,
      phone: '+91 98205 55555', department: 'Operations', designation: 'Operations Manager',
      skills: ['Logistics', 'Customs', 'Inventory', 'Supply Chain'],
      salary: 60000, salaryType: 'MONTHLY', currency: 'INR',
      joiningDate: shiftDate(today, -500), birthday: '1994-09-12',
      vacationDays: 24, vacationUsed: 8, bio: 'Ops lead managing Dubai, Singapore and UK shipment corridors.',
    },
    {
      userId: rahul._id, businessId: exports_biz._id,
      phone: '+91 98202 22222', department: 'Sales', designation: 'Sales Executive',
      skills: ['Export Documentation', 'Client Relations', 'Pricing'],
      salary: 55000, salaryType: 'MONTHLY', currency: 'INR',
      joiningDate: shiftDate(today, -300), birthday: '1995-07-22',
      vacationDays: 24, vacationUsed: 3,
    },
  ]);

  // ── Projects ──────────────────────────────────────────────────────────────────
  const [projKhanna, projMobileApp, projBrand, projWebsite, projDubai] = await Project.create([
    {
      businessId: agency._id, name: 'Khanna Jewellers — Brand Refresh',
      description: 'Full brand identity redesign including logo, packaging, and digital presence.',
      status: 'active', estimatedHours: 120, actualHours: 68,
      hourlyRate: 3500, costRate: 1800,
      startDate: day(-30), endDate: day(20),
    },
    {
      businessId: agency._id, name: 'CafeAndaaz Mobile App',
      description: 'React Native app for ordering, loyalty points, and table reservations.',
      status: 'active', estimatedHours: 300, actualHours: 210,
      hourlyRate: 4000, costRate: 2200,
      startDate: day(-60), endDate: day(30),
    },
    {
      businessId: agency._id, name: 'Gupta Textiles — E-commerce',
      description: 'B2B e-commerce portal with catalogue, RFQ and payment gateway.',
      status: 'planning', estimatedHours: 200, actualHours: 0,
      hourlyRate: 3800, costRate: 2000,
      startDate: day(10), endDate: day(90),
    },
    {
      businessId: agency._id, name: 'Sunrise Schools — Website',
      description: 'Marketing website + admissions form + virtual tour integration.',
      status: 'completed', estimatedHours: 80, actualHours: 76,
      hourlyRate: 3200, costRate: 1600,
      startDate: day(-90), endDate: day(-5),
    },
    {
      businessId: exports_biz._id, name: 'Dubai Shipment Q2',
      description: 'Container booking, customs clearance and delivery for Q2 export batch.',
      status: 'active', estimatedHours: 60, actualHours: 32,
      hourlyRate: 2500, costRate: 1200,
      startDate: day(-15), endDate: day(15),
    },
  ]);

  // ── Tasks ─────────────────────────────────────────────────────────────────────
  await Task.create([
    // Agency — Priya
    { businessId: agency._id, assigneeId: priya._id, projectId: projKhanna._id,
      title: 'Logo concepts (3 directions)', status: 'DONE', priority: 'HIGH',
      dueAt: day(-10), completedAt: day(-11), confirmedByOwner: true,
      estimatedHours: 8, actualHours: 7.5, isBillable: true, hourlyRate: 3500 },
    { businessId: agency._id, assigneeId: priya._id, projectId: projKhanna._id,
      title: 'Brand guidelines document', status: 'IN_PROGRESS', priority: 'HIGH',
      dueAt: day(3), estimatedHours: 12, actualHours: 5, isBillable: true, hourlyRate: 3500 },
    { businessId: agency._id, assigneeId: priya._id, projectId: projMobileApp._id,
      title: 'App UI kit — all screens', status: 'DONE', priority: 'HIGH',
      dueAt: day(-5), completedAt: day(-6), confirmedByOwner: true,
      estimatedHours: 20, actualHours: 22, isBillable: true, hourlyRate: 4000 },
    { businessId: agency._id, assigneeId: priya._id, projectId: projMobileApp._id,
      title: 'Onboarding flow animations', status: 'IN_PROGRESS', priority: 'MED',
      dueAt: day(7), estimatedHours: 10, actualHours: 3, isBillable: true, hourlyRate: 4000 },
    { businessId: agency._id, assigneeId: priya._id,
      title: 'Instagram creatives — Diwali campaign', status: 'TODO', priority: 'MED',
      dueAt: day(14), estimatedHours: 6, isBillable: false },

    // Agency — Rahul
    { businessId: agency._id, assigneeId: rahul._id,
      title: 'Send proposal to Gupta Textiles', status: 'TODO', priority: 'HIGH',
      dueAt: hr(-20), estimatedHours: 2, isBillable: false },
    { businessId: agency._id, assigneeId: rahul._id,
      title: 'Close Q2 invoices — all clients', status: 'DONE', priority: 'MED',
      dueAt: day(-2), completedAt: day(-1), confirmedByOwner: false,
      estimatedHours: 3, actualHours: 3.5, isBillable: false },
    { businessId: agency._id, assigneeId: rahul._id, projectId: projKhanna._id,
      title: 'Client presentation deck — Khanna final review', status: 'TODO', priority: 'HIGH',
      dueAt: day(2), estimatedHours: 4, isBillable: true, hourlyRate: 3500 },
    { businessId: agency._id, assigneeId: rahul._id,
      title: 'Renewal calls — 5 existing clients', status: 'IN_PROGRESS', priority: 'MED',
      dueAt: day(5), estimatedHours: 5, actualHours: 2, isBillable: false },

    // Agency — Vikram
    { businessId: agency._id, assigneeId: vikram._id, projectId: projMobileApp._id,
      title: 'Auth module (OTP + JWT)', status: 'DONE', priority: 'HIGH',
      dueAt: day(-15), completedAt: day(-14), confirmedByOwner: true,
      estimatedHours: 16, actualHours: 14, isBillable: true, hourlyRate: 4000 },
    { businessId: agency._id, assigneeId: vikram._id, projectId: projMobileApp._id,
      title: 'Menu + Cart screens API integration', status: 'DONE', priority: 'HIGH',
      dueAt: day(-8), completedAt: day(-7), confirmedByOwner: true,
      estimatedHours: 20, actualHours: 19, isBillable: true, hourlyRate: 4000 },
    { businessId: agency._id, assigneeId: vikram._id, projectId: projMobileApp._id,
      title: 'Push notifications (FCM)', status: 'IN_PROGRESS', priority: 'HIGH',
      dueAt: day(4), estimatedHours: 12, actualHours: 6, isBillable: true, hourlyRate: 4000 },
    { businessId: agency._id, assigneeId: vikram._id, projectId: projMobileApp._id,
      title: 'Payment gateway integration (Razorpay)', status: 'TODO', priority: 'HIGH',
      dueAt: day(12), estimatedHours: 16, isBillable: true, hourlyRate: 4000 },
    { businessId: agency._id, assigneeId: vikram._id, projectId: projWebsite._id,
      title: 'Virtual tour embed + SEO audit', status: 'DONE', priority: 'MED',
      dueAt: day(-6), completedAt: day(-7), confirmedByOwner: true,
      estimatedHours: 8, actualHours: 9, isBillable: true, hourlyRate: 3200 },

    // Agency — Meera
    { businessId: agency._id, assigneeId: meera._id,
      title: 'Blog calendar — July & August', status: 'DONE', priority: 'MED',
      dueAt: day(-3), completedAt: day(-4), confirmedByOwner: true,
      estimatedHours: 4, actualHours: 3, isBillable: false },
    { businessId: agency._id, assigneeId: meera._id, projectId: projKhanna._id,
      title: 'Product description copy — 50 SKUs', status: 'IN_PROGRESS', priority: 'HIGH',
      dueAt: day(6), estimatedHours: 10, actualHours: 4, isBillable: true, hourlyRate: 3500 },
    { businessId: agency._id, assigneeId: meera._id,
      title: 'LinkedIn content — 12 posts for Q3', status: 'TODO', priority: 'LOW',
      dueAt: day(20), estimatedHours: 8, isBillable: false },
    { businessId: agency._id, assigneeId: meera._id, projectId: projWebsite._id,
      title: 'School homepage copy + meta tags', status: 'DONE', priority: 'HIGH',
      dueAt: day(-10), completedAt: day(-11), confirmedByOwner: true,
      estimatedHours: 6, actualHours: 6, isBillable: true, hourlyRate: 3200 },

    // Exports — Sana
    { businessId: exports_biz._id, assigneeId: sana._id, projectId: projDubai._id,
      title: 'Customs paperwork — Dubai shipment', status: 'IN_PROGRESS', priority: 'HIGH',
      dueAt: hr(8), estimatedHours: 6, actualHours: 3, isBillable: true, hourlyRate: 2500 },
    { businessId: exports_biz._id, assigneeId: sana._id,
      title: 'Update inventory sheet — June closing', status: 'DONE', priority: 'LOW',
      dueAt: day(-1), completedAt: day(-1), confirmedByOwner: true,
      estimatedHours: 3, actualHours: 2.5, isBillable: false },
    { businessId: exports_biz._id, assigneeId: sana._id,
      title: 'Supplier onboarding — Jaipur textiles', status: 'TODO', priority: 'MED',
      dueAt: day(5), estimatedHours: 4, isBillable: false },
    { businessId: exports_biz._id, assigneeId: sana._id,
      title: 'Q3 shipment plan — Singapore route', status: 'TODO', priority: 'HIGH',
      dueAt: day(10), estimatedHours: 8, isBillable: false },

    // Exports — Rahul
    { businessId: exports_biz._id, assigneeId: rahul._id,
      title: 'Payment follow-up — Meridian Imports ₹2.4L', status: 'IN_PROGRESS', priority: 'HIGH',
      dueAt: hr(-5), estimatedHours: 2, actualHours: 1, isBillable: false },
    { businessId: exports_biz._id, assigneeId: rahul._id,
      title: 'New lead — Al Futtaim Group pricing sheet', status: 'TODO', priority: 'MED',
      dueAt: day(3), estimatedHours: 3, isBillable: false },
  ]);

  // ── Follow-ups ────────────────────────────────────────────────────────────────
  await FollowUp.create([
    // Agency — Rahul
    { businessId: agency._id, userId: rahul._id, clientName: 'Khanna Jewellers',
      contact: '+91 98100 10001', note: 'Discuss phase-2 scope & budget post brand guidelines delivery',
      dueAt: hr(6), status: 'PENDING' },
    { businessId: agency._id, userId: rahul._id, clientName: 'Gupta Textiles',
      contact: '+91 98100 10002', note: 'Proposal follow-up — they requested revised pricing',
      dueAt: hr(-30), status: 'OVERDUE' },
    { businessId: agency._id, userId: rahul._id, clientName: 'TechNova Startup',
      contact: 'deals@technova.in', note: 'First intro call — referred by Khanna Jewellers',
      dueAt: day(2), status: 'PENDING' },
    { businessId: agency._id, userId: rahul._id, clientName: 'Sunrise Schools',
      contact: 'principal@sunriseschools.in', note: 'Website live — collect testimonial & check SEO results',
      dueAt: day(-1), status: 'DONE',
      outcome: 'Got 5-star review. Referred to sister school Sunrise Junior.', closedAt: day(-1) },
    { businessId: agency._id, userId: rahul._id, clientName: 'Sharma & Sons Retail',
      contact: '+91 98100 10005', note: 'Cold outreach — branding package interest expressed on LinkedIn',
      dueAt: day(7), status: 'PENDING' },

    // Agency — Priya
    { businessId: agency._id, userId: priya._id, clientName: 'Cafe Andaaz',
      contact: 'design@cafeandaaz.in', note: 'Logo feedback round 2 — share revised options',
      dueAt: hr(50), status: 'PENDING' },
    { businessId: agency._id, userId: priya._id, clientName: 'Khanna Jewellers',
      contact: '+91 98100 10001', note: 'Packaging mockup review call',
      dueAt: day(4), status: 'PENDING' },

    // Agency — Meera
    { businessId: agency._id, userId: meera._id, clientName: 'IndiaBizConnect (Guest Post)',
      contact: 'editor@indiabizconnect.com', note: 'Submit agency case study for publication',
      dueAt: day(5), status: 'PENDING' },

    // Exports — Sana
    { businessId: exports_biz._id, userId: sana._id, clientName: 'Al-Noor Trading (Dubai)',
      contact: 'alnoor@example.ae', note: 'Confirm container booking & delivery window',
      dueAt: hr(4), status: 'PENDING' },
    { businessId: exports_biz._id, userId: sana._id, clientName: 'Green Fields UK',
      contact: 'procurement@greenfields.co.uk', note: 'Send fabric samples — confirmed interested',
      dueAt: day(-2), status: 'DONE',
      outcome: 'Samples dispatched via DHL. Follow-up in 10 days for feedback.', closedAt: day(-2) },
    { businessId: exports_biz._id, userId: sana._id, clientName: 'Singapore Textiles Hub',
      contact: '+65 9000 0001', note: 'Q3 route pricing — needs confirmation by EOM',
      dueAt: day(8), status: 'PENDING' },

    // Exports — Rahul
    { businessId: exports_biz._id, userId: rahul._id, clientName: 'Meridian Imports',
      contact: 'accounts@meridian.com', note: 'Payment reminder — ₹2.4L overdue 15 days',
      dueAt: hr(-5), status: 'OVERDUE' },
    { businessId: exports_biz._id, userId: rahul._id, clientName: 'Al Futtaim Group',
      contact: 'b2b@alfuttaim.ae', note: 'Send product catalogue and HS code list',
      dueAt: day(3), status: 'PENDING' },
  ]);

  // ── Time Entries (last 14 days) ───────────────────────────────────────────────
  const days14 = Array.from({ length: 14 }, (_, i) => shiftDate(today, -(13 - i)));

  const timeData: Parameters<typeof TimeEntry.create>[0][] = [];
  const memberMinutes: Record<string, number[]> = {
    [String(priya._id)]:  [350, 420, 0, 390, 480, 310, 0, 400, 360, 0, 450, 420, 380, 200],
    [String(rahul._id)]:  [280, 300, 0, 270, 320, 250, 0, 290, 310, 0, 330, 280, 300, 150],
    [String(vikram._id)]: [420, 450, 0, 400, 480, 390, 0, 460, 440, 0, 480, 420, 410, 220],
    [String(meera._id)]:  [300, 320, 0, 280, 350, 260, 0, 310, 330, 0, 370, 300, 290, 140],
    [String(sana._id)]:   [380, 410, 0, 360, 420, 340, 0, 395, 380, 0, 430, 395, 350, 180],
  };

  const memberNotes: Record<string, string[]> = {
    [String(priya._id)]:  ['UI screens & wireframes', 'Brand assets & icons', '', 'Figma components', 'Client revision rounds', 'Design review & export', '', 'Mobile app screens', 'Logo iterations', '', 'Brand guidelines doc', 'Packaging mockups', 'Animation frames', 'Sign-off prep'],
    [String(rahul._id)]:  ['Proposal writing', 'Client calls & follow-ups', '', 'CRM updates', 'Sales pipeline review', 'Outreach emails', '', 'Demo calls', 'Negotiation calls', '', 'Contract drafts', 'Invoice follow-ups', 'Lead research', 'Weekly wrap'],
    [String(vikram._id)]: ['Backend API development', 'React components', '', 'DB schema & migrations', 'Auth & security', 'Code review', '', 'Feature development', 'Bug fixes & testing', '', 'DevOps & deployment', 'API integration', 'Performance tuning', 'Sprint review'],
    [String(meera._id)]:  ['Blog posts & SEO', 'Social media content', '', 'Email campaign draft', 'Content calendar', 'Copy editing', '', 'LinkedIn articles', 'Product descriptions', '', 'Campaign analysis', 'Newsletter copy', 'Content audit', 'Monthly report'],
    [String(sana._id)]:   ['Shipment documentation', 'Supplier coordination', '', 'Customs filing', 'Inventory management', 'Vendor calls', '', 'Export logistics', 'Container tracking', '', 'Quality checks', 'Operations report', 'Team briefing', 'Dispatch planning'],
  };

  for (const [userId, minutesArr] of Object.entries(memberMinutes)) {
    const biz = userId === String(sana._id) ? exports_biz._id : agency._id;
    minutesArr.forEach((mins, i) => {
      if (mins > 0) {
        timeData.push({
          businessId: biz, userId,
          date: days14[i], minutes: mins,
          note: memberNotes[userId][i], source: i % 3 === 0 ? 'TIMER' : 'MANUAL',
        });
      }
    });
  }
  await TimeEntry.create(timeData);

  // ── Daily Logs ────────────────────────────────────────────────────────────────
  const logData = [
    // Priya
    { businessId: agency._id, userId: priya._id, date: days14[13], summary: 'Worked on brand guidelines document — typography section complete. Sent font pairing options to Arjun for sign-off.' },
    { businessId: agency._id, userId: priya._id, date: days14[12], summary: 'Completed all Khanna packaging mockups (5 variants). Uploaded to shared drive. Waiting for client feedback.' },
    { businessId: agency._id, userId: priya._id, date: days14[11], summary: 'Full day on mobile app screens — cart, checkout, and profile UI done. Handed off to Vikram for integration.' },
    { businessId: agency._id, userId: priya._id, date: days14[9],  summary: 'Worked on Cafe Andaaz logo — prepared round 2 options. Will present Thursday.' },
    { businessId: agency._id, userId: priya._id, date: days14[8],  summary: 'Brand guidelines 70% done. Added color system, icon guidelines. 2 more sections pending.' },
    { businessId: agency._id, userId: priya._id, date: days14[6],  summary: 'Revised CafeAndaaz animations based on client feedback. 3 screens pending.' },
    { businessId: agency._id, userId: priya._id, date: days14[4],  summary: 'Finished all 5 onboarding animation frames. Delivered to Vikram. Starting Diwali creatives next.' },
    // Rahul
    { businessId: agency._id, userId: rahul._id, date: days14[13], summary: 'Had 4 client calls today. Gupta Textiles asked for revised pricing — will update proposal tomorrow.' },
    { businessId: agency._id, userId: rahul._id, date: days14[12], summary: 'Closed Q2 invoices for 8 clients. ₹3.2L collected. 1 pending (Meridian). Following up tomorrow.' },
    { businessId: agency._id, userId: rahul._id, date: days14[11], summary: 'Sent renewal offers to 5 existing clients. 2 confirmed immediately. 3 need follow-up next week.' },
    { businessId: agency._id, userId: rahul._id, date: days14[8],  summary: 'Demo call with TechNova — strong intent. Will share proposal by EOD Friday.' },
    { businessId: agency._id, userId: rahul._id, date: days14[4],  summary: 'Proposal sent to Gupta Textiles (revised). Pipeline looking healthy at ₹28L for Q3.' },
    // Vikram
    { businessId: agency._id, userId: vikram._id, date: days14[13], summary: 'Completed payment gateway integration. Razorpay test transactions working. Moving to production setup tomorrow.' },
    { businessId: agency._id, userId: vikram._id, date: days14[12], summary: 'FCM push notifications done — tested on Android & iOS. All 3 notification types working.' },
    { businessId: agency._id, userId: vikram._id, date: days14[11], summary: 'Fixed 6 bugs from QA report. App performance improved by 30% after lazy loading implementation.' },
    { businessId: agency._id, userId: vikram._id, date: days14[8],  summary: "Finished menu + cart API integration. Priya's UI screens are now fully connected to backend." },
    { businessId: agency._id, userId: vikram._id, date: days14[4],  summary: 'Code review with team. Refactored auth module. Added rate limiting. Deployment pipeline set up on Vercel.' },
    // Meera
    { businessId: agency._id, userId: meera._id, date: days14[13], summary: 'Wrote 4 LinkedIn posts for Arjun and 2 agency posts. Scheduled for next 2 weeks.' },
    { businessId: agency._id, userId: meera._id, date: days14[12], summary: 'Completed 50 product descriptions for Khanna Jewellers. All uploaded to the shared doc.' },
    { businessId: agency._id, userId: meera._id, date: days14[11], summary: 'Blog post on "Top 5 Design Trends 2026" — drafted, reviewed, published. 800+ words with infographic.' },
    { businessId: agency._id, userId: meera._id, date: days14[8],  summary: 'Email campaign for agency newsletter. 1,200 contacts. A/B test subject lines ready.' },
    // Sana
    { businessId: exports_biz._id, userId: sana._id, date: days14[13], summary: 'Dubai customs paperwork 80% done. Broker call scheduled 10am tomorrow to verify HS codes.' },
    { businessId: exports_biz._id, userId: sana._id, date: days14[12], summary: 'Inventory June closing done. Updated spreadsheet. Variance of ₹12,000 in cotton fabric — raised with supplier.' },
    { businessId: exports_biz._id, userId: sana._id, date: days14[11], summary: 'Container confirmed for Dubai batch. 3 consignments ready. Dispatch set for day after tomorrow.' },
    { businessId: exports_biz._id, userId: sana._id, date: days14[8],  summary: 'Green Fields UK samples dispatched. Added tracking to CRM. Followed up with Singapore route queries.' },
    { businessId: exports_biz._id, userId: sana._id, date: days14[4],  summary: 'Q3 planning done for Dubai and Singapore corridors. Shared draft with Arjun for review.' },
  ];
  await DailyLog.create(logData);

  // ── Performance Scores (last 10 working days) ─────────────────────────────────
  const scoreDays = Array.from({ length: 10 }, (_, i) => shiftDate(today, -(9 - i)));
  const scoreSeeds = [
    { user: priya._id,  biz: agency._id,      scores: [88, 91, 85, 93, 87, 90, 94, 89, 92, 95] },
    { user: rahul._id,  biz: agency._id,      scores: [72, 75, 70, 78, 73, 76, 80, 74, 77, 79] },
    { user: vikram._id, biz: agency._id,      scores: [90, 92, 88, 95, 91, 93, 96, 90, 94, 97] },
    { user: meera._id,  biz: agency._id,      scores: [80, 82, 78, 85, 81, 83, 86, 80, 84, 87] },
    { user: sana._id,   biz: exports_biz._id, scores: [85, 88, 83, 90, 86, 89, 91, 87, 90, 93] },
    { user: rahul._id,  biz: exports_biz._id, scores: [68, 72, 66, 74, 70, 73, 76, 71, 74, 77] },
  ];

  const perfData: Parameters<typeof PerformanceScore.create>[0][] = [];
  for (const s of scoreSeeds) {
    s.scores.forEach((score, i) => {
      perfData.push({
        businessId: s.biz, userId: s.user, date: scoreDays[i], score,
        breakdown: {
          taskCompletion: Math.round(score * 0.9),
          onTimeDelivery: Math.round(score * 0.85),
          followupClosure: Math.round(score * 0.8),
          consistency: Math.round(score * 0.95),
          efficiency: Math.round(score * 1.05),
          bonus: score > 90 ? 5 : 0,
        },
        metrics: {
          tasksCompleted: Math.floor(score / 20),
          tasksOnTime: Math.floor(score / 25),
          hoursLogged: Math.round((score / 100) * 8 * 10) / 10,
          followupsClosed: Math.floor(score / 35),
          followupsOverdue: score < 75 ? 1 : 0,
        },
        summary: score >= 90
          ? 'Excellent performance — top of team this week. Keep it up!'
          : score >= 80
          ? 'Strong performance with consistent output. Minor areas to improve.'
          : 'Decent effort. Follow-up closure rate needs improvement.',
      });
    });
  }
  await PerformanceScore.create(perfData);

  // ── Streaks ───────────────────────────────────────────────────────────────────
  await Streak.create([
    {
      userId: priya._id, businessId: agency._id,
      currentStreak: 12, longestStreak: 18, lastActivityDate: today,
      totalActiveDays: 67, xpPoints: 3350, level: 7,
      badges: ['Early Bird', '7-Day Streak', '30-Day Streak', 'Top Performer'],
      weeklyActivity: scoreDays.slice(-7).map((d, i) => ({ date: d, score: [88, 91, 85, 93, 87, 90, 94][i] })),
    },
    {
      userId: rahul._id, businessId: agency._id,
      currentStreak: 5, longestStreak: 14, lastActivityDate: today,
      totalActiveDays: 42, xpPoints: 2100, level: 4,
      badges: ['First Week', '7-Day Streak'],
      weeklyActivity: scoreDays.slice(-7).map((d, i) => ({ date: d, score: [72, 75, 70, 78, 73, 76, 80][i] })),
    },
    {
      userId: vikram._id, businessId: agency._id,
      currentStreak: 19, longestStreak: 22, lastActivityDate: today,
      totalActiveDays: 89, xpPoints: 4450, level: 9,
      badges: ['Early Bird', '7-Day Streak', '14-Day Streak', '30-Day Streak', 'Code Ninja', 'Top Performer'],
      weeklyActivity: scoreDays.slice(-7).map((d, i) => ({ date: d, score: [90, 92, 88, 95, 91, 93, 96][i] })),
    },
    {
      userId: meera._id, businessId: agency._id,
      currentStreak: 8, longestStreak: 11, lastActivityDate: today,
      totalActiveDays: 51, xpPoints: 2550, level: 5,
      badges: ['First Week', '7-Day Streak', 'Content Queen'],
      weeklyActivity: scoreDays.slice(-7).map((d, i) => ({ date: d, score: [80, 82, 78, 85, 81, 83, 86][i] })),
    },
    {
      userId: sana._id, businessId: exports_biz._id,
      currentStreak: 15, longestStreak: 20, lastActivityDate: today,
      totalActiveDays: 78, xpPoints: 3900, level: 8,
      badges: ['Early Bird', '7-Day Streak', '14-Day Streak', '30-Day Streak', 'Ops Star'],
      weeklyActivity: scoreDays.slice(-7).map((d, i) => ({ date: d, score: [85, 88, 83, 90, 86, 89, 91][i] })),
    },
  ]);

  // ── Payments (last 3 months) ──────────────────────────────────────────────────
  const months = [
    shiftDate(today, -60).slice(0, 7),
    shiftDate(today, -30).slice(0, 7),
    today.slice(0, 7),
  ];

  const paymentSeeds = [
    { user: priya._id,  biz: agency._id,      base: 75000, statuses: ['PAID', 'PAID', 'PENDING'] as const },
    { user: rahul._id,  biz: agency._id,      base: 65000, statuses: ['PAID', 'PAID', 'DRAFT']   as const },
    { user: vikram._id, biz: agency._id,      base: 90000, statuses: ['PAID', 'PAID', 'PENDING'] as const },
    { user: meera._id,  biz: agency._id,      base: 55000, statuses: ['PAID', 'APPROVED', 'DRAFT'] as const },
    { user: sana._id,   biz: exports_biz._id, base: 60000, statuses: ['PAID', 'PAID', 'PENDING'] as const },
    { user: rahul._id,  biz: exports_biz._id, base: 55000, statuses: ['PAID', 'PAID', 'DRAFT']   as const },
  ];

  const paymentData: Parameters<typeof Payment.create>[0][] = [];
  for (const p of paymentSeeds) {
    months.forEach((period, i) => {
      const bonus = i === 0 ? 5000 : i === 1 ? 3000 : 0;
      const deduction = i === 1 && p.user === rahul._id ? 2000 : 0;
      const total = p.base + bonus - deduction;
      paymentData.push({
        businessId: p.biz, userId: p.user, period,
        baseSalary: p.base, bonusAmount: bonus, deductionAmount: deduction,
        totalAmount: total, currency: 'INR',
        actualHoursWorked: Math.round(160 + (Math.random() - 0.3) * 20),
        tasksCompleted: Math.floor(8 + Math.random() * 5),
        performanceScore: Math.round(75 + Math.random() * 20),
        status: p.statuses[i],
        paidAt: p.statuses[i] === 'PAID' ? day(-30 * (2 - i) - 2) : undefined,
        approvedBy: p.statuses[i] !== 'DRAFT' ? owner._id : undefined,
        notes: bonus > 0 ? `Performance bonus for strong delivery in ${period}` : undefined,
        paymentMethod: p.statuses[i] === 'PAID' ? 'Bank Transfer' : undefined,
      });
    });
  }
  await Payment.create(paymentData);

  // ── Notifications ─────────────────────────────────────────────────────────────
  await Notification.create([
    { businessId: agency._id, userId: rahul._id,  type: 'FOLLOWUP_OVERDUE', read: false,
      message: '🔴 Follow-up with Gupta Textiles is overdue by 30 hours. Take action now.' },
    { businessId: agency._id, userId: rahul._id,  type: 'TASK_OVERDUE', read: false,
      message: '⚠️ Task "Send proposal to Gupta Textiles" is overdue. Update your progress.' },
    { businessId: agency._id, userId: rahul._id,  type: 'FOLLOWUP_DUE', read: true,
      message: '📞 Follow-up with Khanna Jewellers is due in 6 hours.' },
    { businessId: agency._id, userId: priya._id,  type: 'TASK_ASSIGNED', read: false,
      message: '📋 New task assigned: "Onboarding flow animations" — due in 7 days.' },
    { businessId: agency._id, userId: priya._id,  type: 'FOLLOWUP_DUE', read: true,
      message: '📞 Follow-up with Cafe Andaaz due in 2 days.' },
    { businessId: agency._id, userId: vikram._id, type: 'TASK_ASSIGNED', read: false,
      message: '📋 New task assigned: "Payment gateway integration (Razorpay)" — due in 12 days.' },
    { businessId: agency._id, userId: vikram._id, type: 'GENERAL', read: true,
      message: '🎉 Great work! Your performance score hit 97 today — highest on the team!' },
    { businessId: agency._id, userId: meera._id,  type: 'DAILY_NUDGE', read: false,
      message: '🌙 Don\'t forget to log your daily summary before end of day.' },
    { businessId: exports_biz._id, userId: sana._id,  type: 'FOLLOWUP_DUE', read: false,
      message: '📞 Follow-up with Al-Noor Trading (Dubai) is due in 4 hours.' },
    { businessId: exports_biz._id, userId: rahul._id, type: 'FOLLOWUP_OVERDUE', read: false,
      message: '🔴 Payment follow-up with Meridian Imports overdue. ₹2.4L at risk.' },
    { businessId: exports_biz._id, userId: sana._id,  type: 'TASK_OVERDUE', read: false,
      message: '⚠️ "Customs paperwork — Dubai shipment" deadline approaching in 8 hours.' },
  ]);

  // ── Flashcards ────────────────────────────────────────────────────────────────
  await Flashcard.create([
    // Sales
    { businessId: agency._id, createdBy: rahul._id, category: 'Sales',
      title: 'Handling Price Objections', difficulty: 'MEDIUM',
      question: 'A prospect says "Your price is too high." What is the best response strategy?',
      answer: 'Never discount immediately. First ask "Compared to what?" to understand their benchmark. Then focus on ROI and value delivered — e.g. "Our clients see 3x revenue growth in 6 months." Present price as investment, not cost. Only offer a discount as a final step if deal is at risk.',
      tags: ['sales', 'objections', 'pricing'] },
    { businessId: agency._id, createdBy: rahul._id, category: 'Sales',
      title: 'BANT Qualification Framework', difficulty: 'EASY',
      question: 'What does BANT stand for and when do you use it?',
      answer: 'Budget, Authority, Need, Timeline. Use it to qualify leads: Does the prospect have Budget? Are you talking to the Decision-maker (Authority)? Is there a real Need? What is their purchase Timeline? All 4 should be confirmed before spending time on a full proposal.',
      tags: ['sales', 'qualification', 'framework'] },
    { businessId: agency._id, createdBy: owner._id, category: 'Sales',
      title: 'Follow-up Frequency Rule', difficulty: 'EASY',
      question: 'How many follow-ups should you do before marking a lead as cold?',
      answer: 'Minimum 7 touch-points across different channels (call, email, WhatsApp, LinkedIn) over 3-4 weeks. Day 1: call. Day 3: email. Day 7: WhatsApp. Day 10: LinkedIn. Day 14: value-add email. Day 21: break-up email. Most deals close on follow-up #5-7.',
      tags: ['sales', 'follow-up', 'process'] },

    // Design
    { businessId: agency._id, createdBy: priya._id, category: 'Design',
      title: '60-30-10 Color Rule', difficulty: 'EASY',
      question: 'What is the 60-30-10 color rule in UI/brand design?',
      answer: '60% dominant/background color (neutral), 30% secondary color (complements the dominant), 10% accent color (calls to action, highlights). This creates visual harmony. Example: 60% white/light grey, 30% brand navy, 10% brand orange.',
      tags: ['design', 'color', 'branding'] },
    { businessId: agency._id, createdBy: priya._id, category: 'Design',
      title: 'Logo Clearspace Rule', difficulty: 'MEDIUM',
      question: 'What is clearspace and why does it matter in logo usage?',
      answer: 'Clearspace is the minimum empty space required around a logo to maintain visual clarity. Typically defined as X = height of the logo letterform. No other visual elements should enter this zone. Violation makes logos look cluttered and reduces brand recognition.',
      tags: ['design', 'logo', 'branding'] },

    // Development
    { businessId: agency._id, createdBy: vikram._id, category: 'Development',
      title: 'React Re-render Optimization', difficulty: 'HARD',
      question: 'Name 4 ways to prevent unnecessary re-renders in React.',
      answer: '1. React.memo() — wraps functional components, skips re-render if props unchanged. 2. useMemo() — memoizes expensive computed values. 3. useCallback() — memoizes function references. 4. State colocation — keep state as close to where it is used. Bonus: use Zustand/Redux selectors correctly to avoid broad subscriptions.',
      tags: ['react', 'performance', 'frontend'] },
    { businessId: agency._id, createdBy: vikram._id, category: 'Development',
      title: 'REST vs GraphQL', difficulty: 'MEDIUM',
      question: 'When should you choose GraphQL over REST for an API?',
      answer: 'Choose GraphQL when: (1) Frontend needs flexible, variable-depth queries. (2) Multiple clients (mobile, web) need different data shapes. (3) You want to avoid over-fetching or under-fetching. Choose REST when: (1) Simple CRUD operations. (2) Team is small/junior. (3) Caching is a priority. (4) API is public-facing.',
      tags: ['api', 'graphql', 'rest'] },

    // Operations (Exports)
    { businessId: exports_biz._id, createdBy: sana._id, category: 'Operations',
      title: 'Incoterms — FOB vs CIF', difficulty: 'MEDIUM',
      question: 'What is the difference between FOB and CIF in export trade?',
      answer: 'FOB (Free On Board): Seller is responsible until goods are loaded on the ship. Buyer pays freight and insurance from port of origin. CIF (Cost, Insurance, Freight): Seller pays for shipping and insurance to destination port. Risk transfers at origin port but seller arranges transport. Use CIF when you want control over shipping rates; FOB gives buyer more control.',
      tags: ['exports', 'incoterms', 'logistics'] },
    { businessId: exports_biz._id, createdBy: sana._id, category: 'Operations',
      title: 'HS Code Usage', difficulty: 'EASY',
      question: 'What is an HS Code and why is it critical for exports?',
      answer: 'Harmonized System (HS) Code is a 6-8 digit standardized numerical method of classifying traded products. Critical because: (1) Determines applicable tariff/duty rates. (2) Required on all customs declarations. (3) Wrong HS code can cause shipment holds or fines. Always verify with DGFT website or customs broker before filing.',
      tags: ['exports', 'customs', 'compliance'] },
  ]);

  // ── Holidays ──────────────────────────────────────────────────────────────────
  const yr = today.slice(0, 4);
  await Holiday.create([
    { businessId: agency._id, name: 'Republic Day',           date: `${yr}-01-26`, type: 'PUBLIC',  color: '#FF6B35', isRecurring: true },
    { businessId: agency._id, name: 'Holi',                   date: `${yr}-03-25`, type: 'PUBLIC',  color: '#FF6B35', isRecurring: true },
    { businessId: agency._id, name: 'Good Friday',            date: `${yr}-04-18`, type: 'PUBLIC',  color: '#FF6B35', isRecurring: true },
    { businessId: agency._id, name: 'Company Foundation Day', date: `${yr}-05-01`, type: 'COMPANY', color: '#6366F1', isRecurring: true, description: 'Agency was founded on May 1st, 2020. Celebrate with team lunch!' },
    { businessId: agency._id, name: 'Independence Day',       date: `${yr}-08-15`, type: 'PUBLIC',  color: '#FF6B35', isRecurring: true },
    { businessId: agency._id, name: 'Ganesh Chaturthi',       date: `${yr}-08-27`, type: 'PUBLIC',  color: '#FF6B35', isRecurring: true },
    { businessId: agency._id, name: 'Dussehra',               date: `${yr}-10-02`, type: 'PUBLIC',  color: '#FF6B35', isRecurring: true },
    { businessId: agency._id, name: 'Diwali',                 date: `${yr}-10-20`, type: 'PUBLIC',  color: '#F59E0B', isRecurring: true },
    { businessId: agency._id, name: 'Diwali Bonus Day',       date: `${yr}-10-21`, type: 'COMPANY', color: '#6366F1', isRecurring: true, description: 'Agency holiday — team celebration + bonus distribution.' },
    { businessId: agency._id, name: 'Christmas',              date: `${yr}-12-25`, type: 'PUBLIC',  color: '#10B981', isRecurring: true },
    { businessId: agency._id, name: 'Priya Birthday',         date: '1997-03-15',  type: 'BIRTHDAY', color: '#EC4899', isRecurring: true, employeeId: priya._id },
    { businessId: agency._id, name: 'Vikram Birthday',        date: '1996-11-08',  type: 'BIRTHDAY', color: '#EC4899', isRecurring: true, employeeId: vikram._id },
    // Exports biz
    { businessId: exports_biz._id, name: 'Republic Day',      date: `${yr}-01-26`, type: 'PUBLIC',  color: '#FF6B35', isRecurring: true },
    { businessId: exports_biz._id, name: 'Independence Day',  date: `${yr}-08-15`, type: 'PUBLIC',  color: '#FF6B35', isRecurring: true },
    { businessId: exports_biz._id, name: 'Diwali',            date: `${yr}-10-20`, type: 'PUBLIC',  color: '#F59E0B', isRecurring: true },
    { businessId: exports_biz._id, name: 'Eid ul-Fitr',       date: `${yr}-03-30`, type: 'OPTIONAL', color: '#10B981', isRecurring: true },
    { businessId: exports_biz._id, name: 'Sana Work Anniversary', date: shiftDate(today, -500).slice(5), type: 'ANNIVERSARY', color: '#8B5CF6', isRecurring: true, employeeId: sana._id, description: '5 years with Dukaan Exports!' },
  ]);

  console.log('\n✅ Seed complete!\n');
  console.log('  Owner  : owner@pulse.demo  / pulse1234');
  console.log('  Members: priya@pulse.demo, rahul@pulse.demo, sana@pulse.demo');
  console.log('           vikram@pulse.demo, meera@pulse.demo  / pulse1234\n');
  console.log('  Businesses : Mehta Digital Agency, Dukaan Exports');
  console.log('  Projects   : 5  |  Tasks      : 24  |  Follow-ups : 13');
  console.log('  Time logs  : 14 days  |  Daily logs  : 25 entries');
  console.log('  Payments   : 3 months |  Perf scores : 10 days × 6 members');
  console.log('  Flashcards : 9  |  Holidays   : 17  |  Notifications: 11\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
