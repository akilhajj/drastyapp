import React from 'react';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/lang';
import {
  LayoutDashboard, Users, BookOpen, FileText, Bell, Ticket, Settings,
  LogOut, GraduationCap, Globe, ChevronRight, BarChart3, Image,
  FlaskConical, Calculator, Globe2, Star
} from 'lucide-react';

const adminNav = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'dashboard' },
  { key: 'students', icon: Users, label: 'students' },
  { key: 'teachers', icon: GraduationCap, label: 'teachers' },
  { key: 'curriculum', icon: FileText, label: 'curriculum' },
  { key: 'subjects', icon: BookOpen, label: 'subjects' },
  { key: 'banners', icon: Image, label: 'banners' },
  { key: 'notifications', icon: Bell, label: 'notifications' },
  { key: 'reports', icon: BarChart3, label: 'reports' },
];

const teacherNav = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'dashboard' },
  { key: 'tickets', icon: Ticket, label: 'tickets' },
  { key: 'consultations', icon: GraduationCap, label: 'consultations' },
  { key: 'students', icon: Users, label: 'studentLogs' },
  { key: 'monitoring', icon: BarChart3, label: 'monitoringShift' },
];

const studentNav = [
  { key: 'home', icon: LayoutDashboard, label: 'home' },
  { key: 'lessons', icon: BookOpen, label: 'myLessons' },
  { key: 'notifications', icon: Bell, label: 'notifications' },
  { key: 'tickets', icon: Ticket, label: 'tickets' },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const { t, lang, setLang, isRTL } = useLang();

  const navItems = profile?.role === 'super_admin' ? adminNav
    : profile?.role === 'teacher' ? teacherNav
    : studentNav;

  const roleLabel = profile?.role === 'super_admin' ? 'Super Admin'
    : profile?.role === 'teacher' ? (lang === 'ar' ? 'معلم' : 'Teacher')
    : (lang === 'ar' ? 'طالب' : 'Student');

  return (
    <aside className={`hidden lg:flex flex-col w-64 min-h-screen bg-navy-900/80 backdrop-blur-xl border-e border-white/10 fixed top-0 ${isRTL ? 'right-0' : 'left-0'} z-30`}>
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">{t('appName')}</div>
            <div className="text-white/40 text-xs">{roleLabel}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button key={item.key} onClick={() => onTabChange(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                active
                  ? 'bg-primary-600/30 text-white border border-primary-500/30 shadow-glow'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-start">{t(item.label as any)}</span>
              {active && <ChevronRight className={`w-3 h-3 opacity-60 ${isRTL ? 'rotate-180' : ''}`} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {/* Profile */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{profile?.full_name}</div>
            <div className="text-xs text-white/40 truncate">{profile?.email}</div>
          </div>
        </div>

        <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/8 transition-all">
          <Globe className="w-4 h-4" />
          {lang === 'ar' ? 'English' : 'العربية'}
        </button>

        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-4 h-4" />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
