import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';
import automationRoutes from './routes/automation.routes';
import businessRoutes from './routes/business.routes';
import dailyLogRoutes from './routes/dailylog.routes';
import dashboardRoutes from './routes/dashboard.routes';
import followupRoutes from './routes/followup.routes';
import memberRoutes from './routes/member.routes';
import notificationRoutes from './routes/notification.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import timeRoutes from './routes/time.routes';
import streakRoutes from './routes/streak.routes';
import profileRoutes from './routes/profile.routes';
import holidayRoutes from './routes/holiday.routes';
import flashcardRoutes from './routes/flashcard.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import { errorMiddleware } from './utils/errors';

const app = express();

const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin requests (no Origin header) and any vercel.app preview URLs
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        return cb(null, true);
      }
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '4mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'flowdesk', version: '2.0' }));

app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorMiddleware);

export default app;
