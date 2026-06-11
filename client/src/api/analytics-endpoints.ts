import { api } from './baseApi';

export interface PerformanceData {
  _id: string;
  businessId: string;
  userId: string;
  date: string;
  score: number;
  summary: string;
  breakdown: {
    taskCompletion: number;
    onTimeDelivery: number;
    followupClosure: number;
    consistency: number;
    efficiency: number;
    bonus: number;
  };
  metrics: {
    tasksCompleted: number;
    tasksOnTime: number;
    hoursLogged: number;
    followupsClosed: number;
    followupsOverdue: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Insights {
  risks: string[];
  opportunities: string[];
  highlights: string[];
}

export const analyticsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPerformanceScores: build.query<{ scores: PerformanceData[] }, string>({
      query: (businessId) => `/analytics/performance?businessId=${businessId}`,
      providesTags: ['Performance'],
    }),
    getEmployeeAnalysis: build.query<
      {
        scores: PerformanceData[];
        latest: PerformanceData;
        weekAverage: number;
        trend: string;
        summary: string;
      },
      { businessId: string; employeeId: string }
    >({
      query: ({ businessId, employeeId }) => `/analytics/employee/${employeeId}?businessId=${businessId}`,
      providesTags: ['Performance'],
    }),
    chatWithAI: build.mutation<
      { message: string; history: ChatMessage[] },
      { businessId: string; message: string }
    >({
      query: (body) => ({ url: '/analytics/chat', method: 'POST', body }),
      invalidatesTags: ['Performance'],
    }),
    getChatHistory: build.query<{ messages: ChatMessage[] }, string>({
      query: (businessId) => `/analytics/chat?businessId=${businessId}`,
      providesTags: ['Performance'],
    }),
    getInsights: build.query<{ insights: Insights }, string>({
      query: (businessId) => `/analytics/insights?businessId=${businessId}`,
      providesTags: ['Performance'],
    }),
  }),
});

export const {
  useGetPerformanceScoresQuery,
  useGetEmployeeAnalysisQuery,
  useChatWithAIMutation,
  useGetChatHistoryQuery,
  useGetInsightsQuery,
} = analyticsApi;
