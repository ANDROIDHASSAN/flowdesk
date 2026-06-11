import { api } from './baseApi';

export interface ProjectSummary {
  _id: string;
  name: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  estimatedHours: number;
  actualHours: number;
  variance: number;
  variancePercent: number;
  cost: number;
  revenue: number;
  profit: number;
  profitMargin: string;
  efficiency: string;
  hourlyRate: number;
}

export interface ProjectDetail {
  project: ProjectSummary;
  tasks: any[];
  summary: {
    estimatedHours: number;
    actualHours: string;
    variance: string;
    revenue: string;
    cost: string;
    profit: string;
    profitMargin: string;
    efficiency: string;
  };
}

export const projectApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProjects: build.query<{ projects: ProjectSummary[] }, string>({
      query: (businessId) => `/projects?businessId=${businessId}`,
      providesTags: ['Project'],
    }),
    getProject: build.query<ProjectDetail, string>({
      query: (id) => `/projects/${id}`,
      providesTags: ['Project'],
    }),
    createProject: build.mutation<
      { project: ProjectSummary },
      { businessId: string; name: string; description?: string; estimatedHours: number; hourlyRate: number; costRate?: number; startDate?: string }
    >({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: ['Project'],
    }),
    updateProject: build.mutation<{ project: ProjectSummary }, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Project'],
    }),
  }),
});

export const { useGetProjectsQuery, useGetProjectQuery, useCreateProjectMutation, useUpdateProjectMutation } = projectApi;
