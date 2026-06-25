import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/lang';
import {
  LayoutDashboard, BookOpen, Bell, Ticket, Menu, X, GraduationCap,
  Globe, LogOut, BarChart3, Users, FileText, Image, Calculator, ChevronRight
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const { profile, signOut } = useAuth();
  const { t, lang, setLang, isRTL } = useLang();
  const [open, setOpen] = useState(false);

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

  const studentNavBottom = [
    { key: 'home', icon: LayoutDashboard, label: 'home' },
    { key: 'lessons', icon: BookOpen, label: 'myLessons' },
    { key: 'notifications', icon: Bell, label: 'notifications' },
    { key: 'tickets', icon: Ticket, label: 'tickets' },
  ];

  const navItems = profile?.role === 'super_admin' ? adminNav
    : profile?.role === 'teacher' ? teacherNav
    : studentNavBottom;

  function handleNav(key: string) {
    onTabChange(key);
    setOpen(false);
  }

  return (
    <>
      {/* Top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-navy-900/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-glow">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">{t('appName')}</span>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg glass text-white/70">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-72 bg-navy-900 border-e border-white/10 flex flex-col animate-slide-in-right`}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">{t('appName')}</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                return (
                  <button key={item.key} onClick={() => handleNav(item.key)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                      active ? 'bg-primary-600/30 text-white border border-primary-500/30' : 'text-white/60 hover:text-white hover:bg-white/8'
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-start">{t(item.label as any)}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
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
          </div>
        </div>
      )}

      {/* Student bottom nav */}
      {profile?.role === 'student' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy-900/90 backdrop-blur-xl border-t border-white/10">
          <div className="flex items-center justify-around px-2 py-2">
            {studentNavBottom.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              return (
                <button key={item.key} onClick={() => handleNav(item.key)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    active ? 'text-primary-400' : 'text-white/40 hover:text-white/70'
                  }`}>
                  <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}`} />
                  <span className="text-xs">{t(item.label as any)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
