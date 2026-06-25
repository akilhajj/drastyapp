import React, { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { LangProvider } from './lib/lang';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import PendingScreen from './components/PendingScreen';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary-700 border-t-primary-400 rounded-full animate-spin" />
          <div className="text-white/40 text-sm animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user || !profile) return <AuthPage />;

  if (profile.role === 'student' && profile.status !== 'active') {
    return <PendingScreen />;
  }

  return (
    <div className="min-h-screen bg-navy-950 bg-mesh">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <main className="lg:ps-64 pt-14 lg:pt-0 pb-16 lg:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 lg:p-6">
          {profile.role === 'super_admin' && (
            <AdminDashboard activeTab={activeTab as any} />
          )}
          {profile.role === 'teacher' && (
            <TeacherDashboard activeTab={activeTab as any} />
          )}
          {profile.role === 'student' && (
            <StudentDashboard activeTab={activeTab as any} />
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LangProvider>
  );
}
