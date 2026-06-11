import { api } from './baseApi';
import {
  AppNotification, BusinessMember, BusinessRef, DailyLog, FollowUp, Invite,
  MemberDetailResponse, MembershipRow, OverviewResponse, Task, TimeEntry, UserRef,
} from '../types';

export const pulseApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Auth ─────────────────────────────────────────────────────────────
    login: build.mutation<{ token: string; user: UserRef }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: build.mutation<{ token: string; user: UserRef }, { name: string; email: string; password: string; inviteToken?: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),

    // ── Businesses ───────────────────────────────────────────────────────
    getBusinesses: build.query<{ businesses: MembershipRow[] }, void>({
      query: () => '/businesses',
      providesTags: ['Business'],
    }),
    createBusiness: build.mutation<{ business: BusinessRef }, { name: string }>({
      query: (body) => ({ url: '/businesses', method: 'POST', body }),
      invalidatesTags: ['Business'],
    }),
    getBusinessMembers: build.query<{ members: BusinessMember[] }, string>({
      query: (businessId) => `/businesses/${businessId}/members`,
      providesTags: ['Member'],
    }),

    // ── Members ──────────────────────────────────────────────────────────
    inviteMember: build.mutation<{ joined: boolean; message: string; inviteLink?: string }, { businessId: string; email: string; displayName?: string }>({
      query: (body) => ({ url: '/members/invite', method: 'POST', body }),
      invalidatesTags: ['Member', 'Invite', 'Overview'],
    }),
    getInvites: build.query<{ invites: Invite[] }, string>({
      query: (businessId) => `/members/invites?businessId=${businessId}`,
      providesTags: ['Invite'],
    }),
    acceptInvite: build.mutation<{ ok: boolean }, { token: string }>({
      query: (body) => ({ url: '/members/accept-invite', method: 'POST', body }),
      invalidatesTags: ['Business'],
    }),
    removeMember: build.mutation<{ ok: boolean }, string>({
      query: (membershipId) => ({ url: `/members/${membershipId}`, method: 'DELETE' }),
      invalidatesTags: ['Member', 'Overview'],
    }),

    // ── Tasks ────────────────────────────────────────────────────────────
    getTasks: build.query<{ tasks: Task[] }, { businessId: string; mine?: boolean; assigneeId?: string; status?: string }>({
      query: ({ businessId, mine, assigneeId, status }) => {
        const p = new URLSearchParams({ businessId });
        if (mine) p.set('mine', 'true');
        if (assigneeId) p.set('assigneeId', assigneeId);
        if (status) p.set('status', status);
        return `/tasks?${p}`;
      },
      providesTags: ['Task'],
    }),
    createTask: build.mutation<{ task: Task }, { businessId: string; assigneeId?: string; title: string; description?: string; priority?: string; dueAt?: string; estimatedHours?: number; projectId?: string }>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: ['Task', 'Overview', 'MemberDetail'],
    }),
    updateTask: build.mutation<{ task: Task }, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/tasks/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Task', 'Overview', 'MemberDetail'],
    }),
    deleteTask: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Task', 'Overview', 'MemberDetail'],
    }),

    // ── Time ─────────────────────────────────────────────────────────────
    getTimeEntries: build.query<{ entries: TimeEntry[] }, { businessId: string; userId?: string; from?: string; to?: string }>({
      query: ({ businessId, userId, from, to }) => {
        const p = new URLSearchParams({ businessId });
        if (userId) p.set('userId', userId);
        if (from) p.set('from', from);
        if (to) p.set('to', to);
        return `/time?${p}`;
      },
      providesTags: ['Time'],
    }),
    logTime: build.mutation<{ entry: TimeEntry }, { businessId: string; taskId?: string; date: string; minutes: number; note?: string; source?: 'MANUAL' | 'TIMER' }>({
      query: (body) => ({ url: '/time', method: 'POST', body }),
      invalidatesTags: ['Time', 'Overview', 'MemberDetail'],
    }),
    deleteTimeEntry: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/time/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Time', 'Overview', 'MemberDetail'],
    }),

    // ── Daily Logs ───────────────────────────────────────────────────────
    getDailyLogs: build.query<{ logs: DailyLog[] }, { businessId: string; userId?: string; from?: string; to?: string }>({
      query: ({ businessId, userId, from, to }) => {
        const p = new URLSearchParams({ businessId });
        if (userId) p.set('userId', userId);
        if (from) p.set('from', from);
        if (to) p.set('to', to);
        return `/daily-logs?${p}`;
      },
      providesTags: ['DailyLog'],
    }),
    saveDailyLog: build.mutation<{ log: DailyLog }, { businessId: string; date: string; summary: string }>({
      query: (body) => ({ url: '/daily-logs', method: 'POST', body }),
      invalidatesTags: ['DailyLog', 'Overview', 'MemberDetail'],
    }),

    // ── Follow-ups ───────────────────────────────────────────────────────
    getFollowUps: build.query<{ followups: FollowUp[] }, { businessId: string; mine?: boolean; status?: string; userId?: string }>({
      query: ({ businessId, mine, status, userId }) => {
        const p = new URLSearchParams({ businessId });
        if (mine) p.set('mine', 'true');
        if (status) p.set('status', status);
        if (userId) p.set('userId', userId);
        return `/followups?${p}`;
      },
      providesTags: ['FollowUp'],
    }),
    createFollowUp: build.mutation<{ followup: FollowUp }, { businessId: string; userId?: string; clientName: string; contact?: string; note?: string; dueAt: string }>({
      query: (body) => ({ url: '/followups', method: 'POST', body }),
      invalidatesTags: ['FollowUp', 'Overview', 'MemberDetail'],
    }),
    updateFollowUp: build.mutation<{ followup: FollowUp }, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/followups/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FollowUp', 'Overview', 'MemberDetail'],
    }),
    deleteFollowUp: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/followups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['FollowUp', 'Overview', 'MemberDetail'],
    }),

    // ── Notifications ────────────────────────────────────────────────────
    getNotifications: build.query<{ items: AppNotification[]; unread: number }, void>({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),
    markNotificationsRead: build.mutation<{ ok: boolean }, { ids?: string[]; all?: boolean }>({
      query: (body) => ({ url: '/notifications/read', method: 'POST', body }),
      invalidatesTags: ['Notification'],
    }),

    // ── Dashboard ────────────────────────────────────────────────────────
    getOverview: build.query<OverviewResponse, string>({
      query: (businessId) => `/dashboard?businessId=${businessId}`,
      providesTags: ['Overview'],
    }),
    getMemberDetail: build.query<MemberDetailResponse, { userId: string; businessId: string }>({
      query: ({ userId, businessId }) => `/analytics/employee/${userId}?businessId=${businessId}`,
      providesTags: ['MemberDetail'],
    }),

    // ── Streaks ──────────────────────────────────────────────────────────
    getMyStreak: build.query<{ streak: { currentStreak: number; longestStreak: number; xpPoints: number; level: number; badges: string[]; totalActiveDays: number } }, string>({
      query: (businessId) => `/streaks/me?businessId=${businessId}`,
      providesTags: ['Streak'],
    }),
    recordActivity: build.mutation<{ streak: unknown; xpGained: number }, { businessId: string }>({
      query: (body) => ({ url: '/streaks/record', method: 'POST', body }),
      invalidatesTags: ['Streak'],
    }),
    getAllStreaks: build.query<{ streaks: unknown[] }, string>({
      query: (businessId) => `/streaks?businessId=${businessId}`,
      providesTags: ['Streak'],
    }),

    // ── Flashcards ───────────────────────────────────────────────────────
    getFlashcards: build.query<{ flashcards: unknown[] }, { businessId: string; category?: string; mine?: boolean }>({
      query: ({ businessId, category, mine }) => {
        const p = new URLSearchParams({ businessId });
        if (category) p.set('category', category);
        if (mine) p.set('mine', 'true');
        return `/flashcards?${p}`;
      },
      providesTags: ['Flashcard'],
    }),
    createFlashcard: build.mutation<{ flashcard: unknown }, { businessId: string; title: string; question: string; answer: string; category: string; difficulty: string; isPublic?: boolean }>({
      query: (body) => ({ url: '/flashcards', method: 'POST', body }),
      invalidatesTags: ['Flashcard'],
    }),
    reviewFlashcard: build.mutation<{ flashcard: unknown }, { id: string; correct: boolean; businessId: string }>({
      query: ({ id, ...body }) => ({ url: `/flashcards/${id}/review`, method: 'POST', body }),
      invalidatesTags: ['Flashcard'],
    }),

    // ── Holidays ─────────────────────────────────────────────────────────
    getHolidays: build.query<{ holidays: unknown[] }, { businessId: string; year?: number }>({
      query: ({ businessId, year }) => {
        const p = new URLSearchParams({ businessId });
        if (year) p.set('year', year.toString());
        return `/holidays?${p}`;
      },
      providesTags: ['Holiday'],
    }),
    createHoliday: build.mutation<{ holiday: unknown }, { businessId: string; name: string; date: string; type: string; isRecurring?: boolean }>({
      query: (body) => ({ url: '/holidays', method: 'POST', body }),
      invalidatesTags: ['Holiday'],
    }),

    // ── Payments ─────────────────────────────────────────────────────────
    getPayments: build.query<{ payments: unknown[] }, { businessId: string; period?: string; userId?: string }>({
      query: ({ businessId, period, userId }) => {
        const p = new URLSearchParams({ businessId });
        if (period) p.set('period', period);
        if (userId) p.set('userId', userId);
        return `/payments?${p}`;
      },
      providesTags: ['Payment'],
    }),
    generatePayment: build.mutation<{ payment: unknown }, { businessId: string; userId: string; period: string }>({
      query: (body) => ({ url: '/payments/generate', method: 'POST', body }),
      invalidatesTags: ['Payment'],
    }),
    updatePayment: build.mutation<{ payment: unknown }, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/payments/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Payment'],
    }),

    // ── Employee Profiles ────────────────────────────────────────────────
    getEmployeeProfiles: build.query<{ members: unknown[] }, string>({
      query: (businessId) => `/profiles?businessId=${businessId}`,
      providesTags: ['Profile'],
    }),
    getMyProfile: build.query<{ profile: unknown }, string>({
      query: (businessId) => `/profiles/me?businessId=${businessId}`,
      providesTags: ['Profile'],
    }),
    updateMyProfile: build.mutation<{ profile: unknown }, Record<string, unknown>>({
      query: (body) => ({ url: '/profiles/me', method: 'PUT', body }),
      invalidatesTags: ['Profile'],
    }),
    updateEmployeeProfile: build.mutation<{ profile: unknown }, { userId: string } & Record<string, unknown>>({
      query: ({ userId, ...body }) => ({ url: `/profiles/${userId}`, method: 'PATCH', body }),
      invalidatesTags: ['Profile'],
    }),

    // ── Admin ────────────────────────────────────────────────────────────
    getAdminOverview: build.query<{ overview: unknown }, string>({
      query: (businessId) => `/admin/overview?businessId=${businessId}`,
      providesTags: ['Overview'],
    }),
    getAdminEmployees: build.query<{ employees: unknown[] }, string>({
      query: (businessId) => `/admin/employees?businessId=${businessId}`,
      providesTags: ['Member'],
    }),
    getAdminSummary: build.query<{ summary: unknown }, { businessId: string; period?: string }>({
      query: ({ businessId, period }) => {
        const p = new URLSearchParams({ businessId });
        if (period) p.set('period', period);
        return `/admin/summary?${p}`;
      },
      providesTags: ['Payment'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetBusinessesQuery,
  useCreateBusinessMutation,
  useGetBusinessMembersQuery,
  useInviteMemberMutation,
  useGetInvitesQuery,
  useAcceptInviteMutation,
  useRemoveMemberMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetTimeEntriesQuery,
  useLogTimeMutation,
  useDeleteTimeEntryMutation,
  useGetDailyLogsQuery,
  useSaveDailyLogMutation,
  useGetFollowUpsQuery,
  useCreateFollowUpMutation,
  useUpdateFollowUpMutation,
  useDeleteFollowUpMutation,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useGetOverviewQuery,
  useGetMemberDetailQuery,
  useGetMyStreakQuery,
  useRecordActivityMutation,
  useGetAllStreaksQuery,
  useGetFlashcardsQuery,
  useCreateFlashcardMutation,
  useReviewFlashcardMutation,
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useGetPaymentsQuery,
  useGeneratePaymentMutation,
  useUpdatePaymentMutation,
  useGetEmployeeProfilesQuery,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useUpdateEmployeeProfileMutation,
  useGetAdminOverviewQuery,
  useGetAdminEmployeesQuery,
  useGetAdminSummaryQuery,
} = pulseApi;
