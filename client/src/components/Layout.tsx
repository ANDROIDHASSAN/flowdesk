import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Users, FolderKanban, MessageSquare,
  Sun, Bell, LogOut, ChevronLeft, ChevronRight, Settings, Trophy,
  BookOpen, Calendar, CreditCard, BarChart3, Zap, Target, Menu, X,
  TrendingUp, Shield
} from 'lucide-react';
import { useGetBusinessesQuery } from '../api/endpoints';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/authSlice';
import AIChatWidget from './AIChatWidget';
import BusinessSwitcher from './BusinessSwitcher';
import NotificationBell from './NotificationBell';
import QuickAddButton from './QuickAddButton';
import { Avatar, Badge, StreakWidget, Toaster } from './ui';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'brand' | 'success' | 'warning' | 'danger';
}

const OWNER_NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
      { to: '/leaderboard', label: 'Leaderboard', icon: <Trophy size={18} /> },
    ],
  },
  {
    label: 'Work',
    items: [
      { to: '/board', label: 'Task Board', icon: <CheckSquare size={18} /> },
      { to: '/projects', label: 'Projects', icon: <FolderKanban size={18} /> },
      { to: '/pipeline', label: 'Follow-ups', icon: <Target size={18} /> },
    ],
  },
  {
    label: 'Team',
    items: [
      { to: '/members', label: 'Team Members', icon: <Users size={18} /> },
      { to: '/admin', label: 'Admin Panel', icon: <Shield size={18} /> },
      { to: '/payments', label: 'Payments', icon: <CreditCard size={18} /> },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/flashcards', label: 'Flashcards', icon: <BookOpen size={18} /> },
      { to: '/calendar', label: 'Calendar', icon: <Calendar size={18} /> },
    ],
  },
];

const MEMBER_NAV_SECTIONS = [
  {
    label: 'My Work',
    items: [
      { to: '/my-day', label: 'My Day', icon: <Sun size={18} /> },
      { to: '/my-followups', label: 'Follow-ups', icon: <MessageSquare size={18} /> },
    ],
  },
  {
    label: 'Progress',
    items: [
      { to: '/leaderboard', label: 'Leaderboard', icon: <Trophy size={18} /> },
      { to: '/flashcards', label: 'Flashcards', icon: <BookOpen size={18} /> },
      { to: '/calendar', label: 'Calendar', icon: <Calendar size={18} /> },
    ],
  },
];

export default function Layout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const { data } = useGetBusinessesQuery();
  const isOwner = (data?.businesses || []).some((b) => b.role === 'OWNER');
  const navSections = isOwner ? OWNER_NAV_SECTIONS : MEMBER_NAV_SECTIONS;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + '/');

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-glow">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-display font-bold text-white text-lg tracking-tight">FlowDesk</span>
            <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Work Smarter</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">{section.label}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium relative group
                      ${active
                        ? 'bg-brand-500/20 text-brand-300 font-semibold'
                        : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                      } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <span className={`flex-shrink-0 transition-colors ${active ? 'text-brand-400' : 'text-white/40 group-hover:text-white/70'}`}>
                      {item.icon}
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {active && !collapsed && (
                      <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-brand-400" />
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-surface-900 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className={`border-t border-white/5 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold cursor-pointer" title={user?.name}>
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar name={user?.name || 'User'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/35 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors flex-shrink-0" title="Log out">
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Desktop Sidebar */}
      <aside
        className={`sidebar hidden md:flex flex-col transition-all duration-300 ${collapsed ? 'collapsed' : ''}`}
        style={{ width: collapsed ? 72 : 260 }}
      >
        {sidebarContent}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-surface-900 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all shadow-lg"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-sidebar-bg flex flex-col animate-slide-in-left shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-surface-200 px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors">
              <Menu size={20} />
            </button>
            <BusinessSwitcher />
          </div>

          <div className="flex items-center gap-2">
            {isOwner && <StreakWidget streak={0} compact />}
            <NotificationBell />
            <div className="hidden md:flex items-center gap-2 ml-1">
              <Avatar name={user?.name || 'User'} size="sm" />
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-surface-800 leading-none">{user?.name}</p>
                <p className="text-xs text-surface-400 mt-0.5">{isOwner ? 'Owner' : 'Member'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <QuickAddButton />
      {/* AI Chat Widget */}
      <AIChatWidget />
      <Toaster />
    </div>
  );
}
