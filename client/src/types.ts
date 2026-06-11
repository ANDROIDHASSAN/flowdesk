export interface UserRef {
  _id: string;
  name: string;
  email: string;
}

export interface BusinessRef {
  _id: string;
  name: string;
  ownerId?: string;
}

export type Role = 'OWNER' | 'MEMBER';

export interface MembershipRow {
  membershipId: string;
  business: BusinessRef;
  role: Role;
  displayName: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MED' | 'HIGH';

export interface Task {
  _id: string;
  businessId: BusinessRef | string;
  assigneeId: UserRef | string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string;
  completedAt?: string;
  confirmedByOwner: boolean;
  createdAt: string;
}

export interface TimeEntry {
  _id: string;
  businessId: BusinessRef | string;
  userId: string;
  taskId?: { _id: string; title: string } | string | null;
  date: string;
  minutes: number;
  note?: string;
  source: 'MANUAL' | 'TIMER';
  createdAt: string;
}

export interface DailyLog {
  _id: string;
  businessId: BusinessRef | string;
  userId: string;
  date: string;
  summary: string;
}

export type FollowUpStatus = 'PENDING' | 'DONE' | 'OVERDUE';

export interface FollowUp {
  _id: string;
  businessId: BusinessRef | string;
  userId: UserRef | string;
  clientName: string;
  contact?: string;
  note?: string;
  dueAt: string;
  status: FollowUpStatus;
  outcome?: string;
  closedAt?: string;
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  businessId: BusinessRef | string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface MemberCard {
  userId: string;
  name: string;
  email: string;
  businesses: string[];
  isOwner: boolean;
  openTasks: number;
  minutesToday: number;
  minutesWeek: number;
  followupsDueToday: number;
  followupsOverdue: number;
  loggedToday: boolean;
}

export interface OverviewResponse {
  date: string;
  members: MemberCard[];
  needsAttention: {
    overdueFollowups: FollowUp[];
    overdueTasks: Task[];
    notLoggedToday: string[];
  };
}

export interface MemberDetailResponse {
  user: UserRef;
  memberships: { _id: string; businessId: BusinessRef; displayName: string; role: Role }[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  dailyLogs: DailyLog[];
  followups: FollowUp[];
}

export interface BusinessMember {
  _id: string;
  userId: UserRef;
  role: Role;
  displayName: string;
  createdAt: string;
}

export interface Invite {
  _id: string;
  email: string;
  displayName?: string;
  expiresAt: string;
  createdAt: string;
}

/** ref fields arrive populated from the API; narrow them safely */
export function refName(ref: BusinessRef | UserRef | string | null | undefined): string {
  if (!ref) return '';
  return typeof ref === 'string' ? '' : ref.name;
}

export function refId(ref: { _id: string } | string | null | undefined): string {
  if (!ref) return '';
  return typeof ref === 'string' ? ref : ref._id;
}
