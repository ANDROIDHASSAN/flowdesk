# Pulse CRM — Team ka hisaab, ek jagah 📒

A multi-business **team performance CRM + automation layer** for SMB owners who run remote
teams and currently track everything in Excel. Members self-report their work (tasks, time,
end-of-day logs, client follow-ups); the owner sees every business in one dashboard; and an
automation layer chases follow-ups and nudges people so the owner doesn't have to.

**Stack (MERN, 100% free tier — ₹0/month):**

| Layer       | Choice                                                     |
| ----------- | ---------------------------------------------------------- |
| Frontend    | React 18 + Vite + TypeScript                                |
| State / API | Redux Toolkit + **RTK Query** (tag-based cache invalidation)|
| Styling     | Tailwind CSS (custom "digital bahi-khata" design system)    |
| Backend     | Node.js + Express + TypeScript                              |
| Database    | **MongoDB Atlas** free M0 cluster + Mongoose                |
| Auth        | JWT (bcrypt) + email invite links — no third-party vendor   |
| Email       | Resend free tier (100/day) — falls back to console logging  |
| Automation  | self-hosted **n8n** (workflow JSONs included) + node-cron fallback |
| Hosting     | Vercel (client) + Render/Railway free (server)              |

> **Phase 1 only.** Phase 2 (weekly scores, AI summaries, owner digest, analytics) is
> deliberately not built yet. The schema is ready for it (e.g. `TimeEntry.source=TIMER`
> already exists so a future desktop agent needs zero schema changes).

---

## 1. Project layout

```
├── server/          Express + Mongoose API (TypeScript)
│   └── src/
│       ├── models/        User, Business, Membership, Task, TimeEntry,
│       │                  DailyLog, FollowUp, Notification, Invite
│       ├── middleware/    JWT auth, service-token guard, multi-tenant scope guards
│       ├── routes/        auth, businesses, members, tasks, time, daily-logs,
│       │                  followups, notifications, dashboard, automation
│       ├── services/      jobs (the 4 automations), email (Resend), notify
│       └── cron.ts        node-cron fallback scheduler (IST)
├── client/          React + Vite + RTK Query app
│   └── src/
│       ├── api/           baseApi + all RTK Query endpoints
│       ├── store/         auth slice, ui slice (active business)
│       ├── components/    Layout, BusinessSwitcher, NotificationBell, Timer, ui kit
│       └── pages/         auth/, member/ (MyDay, MyFollowUps),
│                          owner/ (Dashboard, MemberDetail, TaskBoard, Pipeline, Members)
└── n8n/             4 exported workflows for the Phase-1 automations
```

## 2. Multi-tenancy & security model

- Two roles per business: `OWNER` and `MEMBER` (a user can be OWNER of one business and
  MEMBER of another).
- **Every** scoped route resolves the caller's `Membership` server-side
  (`server/src/middleware/scope.ts`). A `businessId` from the client is *never* trusted —
  `resolveScope()` / `requireMembership()` / `requireOwnership()` gate every query.
- `businessId=all` gives owners a combined cross-business view (and members a combined
  view of their own data only).
- Members can only read/write their own tasks, time, logs and follow-ups. Owners see
  everything inside their businesses. Only owners can assign, confirm completion
  (`confirmedByOwner`), invite, or remove members.
- `/api/automation/*` is protected by an `x-service-token` header (the `SERVICE_TOKEN`
  env var) — for n8n/cron only, never the browser.

## 3. Free-tier signups (one-time, all ₹0/month)

1. **MongoDB Atlas** — <https://www.mongodb.com/cloud/atlas/register>
   Create a free **M0** cluster → Database Access: add a user → Network Access: allow
   `0.0.0.0/0` (or your server's IP) → copy the connection string into `MONGODB_URI`.
2. **Resend** (optional but recommended) — <https://resend.com>
   Free tier: 100 emails/day. Create an API key → `RESEND_API_KEY`. Without it, emails
   are printed to the server console (fine for local dev).
3. **n8n** — you already self-host at connexo.in; otherwise `npx n8n` runs it locally free.
4. **Vercel** (client hosting) — free Hobby plan.
5. **Render** or **Railway** (server hosting) — free web service tier.

No card required anywhere. Total running cost: **₹0/month**.

## 4. Run locally

```bash
# 1. install
cd server && npm install
cd ../client && npm install

# 2. configure
cd ../server
copy .env.example .env        # then fill MONGODB_URI, JWT_SECRET, SERVICE_TOKEN

# 3. (optional) demo data
npm run seed
#   Owner : owner@pulse.demo / pulse1234
#   Members: priya@pulse.demo, rahul@pulse.demo, sana@pulse.demo / pulse1234

# 4. run both (from repo root — needs `npm install` at root once for concurrently)
cd ..
npm install
npm run dev
# server → http://localhost:4000   client → http://localhost:5173
```

The Vite dev server proxies `/api/*` to `localhost:4000`, so no client env is needed locally.

## 5. The four Phase-1 automations

Each writes an in-app `Notification` **and** sends an email.

| # | Automation                    | What it does                                                          | Schedule (IST) |
| - | ----------------------------- | --------------------------------------------------------------------- | -------------- |
| 1 | Follow-up due reminder        | Per member: consolidated list of follow-ups due today                  | 09:00 daily    |
| 2 | Follow-up overdue escalation  | `PENDING` past `dueAt` → `OVERDUE`; notifies member **and owner**      | hourly         |
| 3 | Daily logging nudge           | Members with no `TimeEntry`/`DailyLog` today get a nudge               | 19:30 Mon–Sat  |
| 4 | Overdue task alert            | Task past `dueAt` not `DONE` → alert assignee + owner (fires **once** per task via `overdueNotifiedAt`) | hourly |

### Automation API (all require `x-service-token: <SERVICE_TOKEN>`)

```
GET  /api/automation/health           connectivity check
GET  /api/automation/due-followups    follow-ups due today (populated with user/business)
GET  /api/automation/missing-logs     members with nothing logged today
GET  /api/automation/overdue-tasks    overdue tasks not yet alerted
POST /api/automation/mark-overdue     flip PENDING→OVERDUE, returns rows + owner contacts
POST /api/automation/notify           body: { notifications:[…], emails:[…] } — n8n posts composed messages
POST /api/automation/run/:job         run a whole built-in job: followup-due | followup-overdue | daily-nudge | overdue-tasks
```

The **read + notify** endpoints let you build fully custom logic inside n8n (edit message
copy, add WhatsApp nodes, etc. without redeploying). The **run/:job** endpoints are the
simple path — one HTTP node per schedule.

### n8n setup

1. In your n8n instance, add two environment variables (Settings → or docker env):
   `PULSE_API_URL` (e.g. `https://your-api.onrender.com`) and `PULSE_SERVICE_TOKEN`
   (same value as the server's `SERVICE_TOKEN`).
2. Import the four JSON files from [n8n/](n8n/) (Workflows → Import from file).
3. Activate them. Workflow 3 shows the read-endpoint pattern (fetch `missing-logs` →
   IF count > 0 → trigger nudges) you can copy for custom flows.

### No n8n? Use the built-in fallback

Set `ENABLE_INTERNAL_CRON=true` on the server — node-cron runs the same four jobs on the
same IST schedule inside the API process. (On free hosts that sleep on idle, prefer an
external pinger like cron-job.org hitting `POST /api/automation/run/:job`, or n8n.)

## 6. Deploy (free)

**Server → Render** (or Railway):
- New Web Service from the `server/` folder. Build: `npm install && npm run build`,
  Start: `npm start`.
- Env vars: `MONGODB_URI`, `JWT_SECRET`, `SERVICE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`,
  `CLIENT_URL` (your Vercel URL), `ENABLE_INTERNAL_CRON` (`false` if n8n handles schedules).
- Note: free Render instances sleep after 15 min idle; the n8n calls wake them up.

**Client → Vercel**:
- Import the repo, set **Root Directory = `client`**. Build command `npm run build`,
  output `dist`.
- Env var: `VITE_API_URL=https://your-api.onrender.com/api`.
- Add a rewrite for SPA routing — `client/vercel.json` is already included.

## 7. Data model (Mongoose)

```
User          (email, name, passwordHash)
Business      (name, ownerId → User)
Membership    (businessId, userId, role[OWNER|MEMBER], displayName)   unique (businessId,userId)
Task          (businessId, assigneeId, title, description?, status[TODO|IN_PROGRESS|DONE],
               priority[LOW|MED|HIGH], dueAt?, completedAt?, confirmedByOwner, overdueNotifiedAt?)
TimeEntry     (businessId, userId, taskId?, date "YYYY-MM-DD", minutes, note?, source[MANUAL|TIMER])
DailyLog      (businessId, userId, date, summary)                     unique (businessId,userId,date)
FollowUp      (businessId, userId, clientName, contact?, note?, dueAt,
               status[PENDING|DONE|OVERDUE], outcome?, closedAt?)
Notification  (businessId, userId, type, message, read)
Invite        (businessId, email, token, invitedBy, expiresAt, acceptedAt?)
```

Indexes on `(businessId, userId)`, `(businessId, status)`, `dueAt`, `date` throughout.
All calendar-day logic (today/week/overdue) runs in **IST**.

## 8. Phase 2 (not built — awaiting review)

Weekly performance score (consistency + completion % + follow-up SLA + hours vs target,
stored with a transparent `breakdown`), Groq AI weekly summaries, owner daily/weekly digest
email, trend analytics, and the optional desktop time agent (writes `TimeEntry` with
`source=TIMER` — already supported by the schema).
