import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

/**
 * One RTK Query api with tag-based cache invalidation; feature endpoints are
 * injected from src/api/endpoints.ts. VITE_API_URL overrides for production
 * (e.g. your Render/Railway server URL); in dev the Vite proxy handles /api.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    'Business', 'Member', 'Invite', 'Task', 'Time', 'DailyLog', 'FollowUp',
    'Notification', 'Overview', 'MemberDetail', 'Performance', 'Project',
    'Streak', 'Flashcard', 'Holiday', 'Payment', 'Profile',
  ],
  endpoints: () => ({}),
});
