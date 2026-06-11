import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useGetBusinessesQuery } from './api/endpoints';
import Layout from './components/Layout';
import { useAppSelector } from './store';
import { LoadingPage } from './components/ui';
import AcceptInvite from './pages/auth/AcceptInvite';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Lazy load all pages for better performance
const MyDay = lazy(() => import('./pages/member/MyDay'));
const MyFollowUps = lazy(() => import('./pages/member/MyFollowUps'));
const Dashboard = lazy(() => import('./pages/owner/Dashboard'));
const Members = lazy(() => import('./pages/owner/Members'));
const MemberDetail = lazy(() => import('./pages/owner/MemberDetail'));
const Pipeline = lazy(() => import('./pages/owner/Pipeline'));
const Projects = lazy(() => import('./pages/owner/Projects'));
const TaskBoard = lazy(() => import('./pages/owner/TaskBoard'));
const AdminPanel = lazy(() => import('./pages/owner/AdminPanel'));
const Leaderboard = lazy(() => import('./pages/owner/Leaderboard'));
const Flashcards = lazy(() => import('./pages/shared/Flashcards'));
const CalendarPage = lazy(() => import('./pages/shared/CalendarPage'));

function Home() {
  const { data, isLoading } = useGetBusinessesQuery();
  if (isLoading) return <LoadingPage />;
  const isOwner = (data?.businesses || []).some((b) => b.role === 'OWNER');
  return <Navigate to={isOwner ? '/dashboard' : '/my-day'} replace />;
}

export default function App() {
  const token = useAppSelector((s) => s.auth.token);

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          {/* Owner routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/team/:userId" element={<MemberDetail />} />
          <Route path="/board" element={<TaskBoard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/members" element={<Members />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          {/* Member routes */}
          <Route path="/my-day" element={<MyDay />} />
          <Route path="/my-followups" element={<MyFollowUps />} />
          {/* Shared routes */}
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/analytics" element={<Dashboard />} />
          <Route path="/payments" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
