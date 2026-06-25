import React from 'react';
import { useLang } from '../lib/lang';
import { useAuth } from '../lib/auth';
import { Clock, XCircle, LogOut, Globe } from 'lucide-react';

export default function PendingScreen() {
  const { profile, signOut } = useAuth();
  const { t, lang, setLang } = useLang();

  const isPending = profile?.status === 'pending';

  return (
    <div className="min-h-screen bg-navy-950 bg-mesh flex items-center justify-center p-4 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-900/20 rounded-full blur-3xl" />

      <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className="absolute top-4 right-4 flex items-center gap-2 glass rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white">
        <Globe className="w-4 h-4" />
        {lang === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="glass-card p-8 max-w-md w-full text-center animate-fade-in">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 animate-float ${
          isPending ? 'bg-amber-500/20' : 'bg-red-500/20'
        }`}>
          {isPending
            ? <Clock className="w-10 h-10 text-amber-400" />
            : <XCircle className="w-10 h-10 text-red-400" />
          }
        </div>

        <h2 className={`text-2xl font-bold mb-2 ${isPending ? 'text-amber-400' : 'text-red-400'}`}>
          {isPending ? t('pendingApproval') : lang === 'ar' ? 'تم رفض الطلب' : 'Request Rejected'}
        </h2>

        <p className="text-white/60 mb-2">
          {profile?.full_name && (lang === 'ar' ? `مرحباً ${profile.full_name}،` : `Hello ${profile.full_name},`)}
        </p>

        <p className="text-white/50 text-sm mb-6">
          {isPending ? t('pendingMessage') : t('rejectedMessage')}
        </p>

        {isPending && (
          <div className="glass-card p-4 text-start mb-6 bg-amber-500/5 border-amber-500/20">
            <p className="text-amber-400/80 text-xs">
              {lang === 'ar'
                ? '• يرجى الانتظار بينما يراجع الأستاذ طلبك ووصل الدفع المقدم'
                : '• Please wait while the admin reviews your application and payment receipt'
              }
            </p>
            <p className="text-amber-400/80 text-xs mt-1">
              {lang === 'ar'
                ? '• سيتم إعلامك فور الموافقة على طلبك'
                : '• You will be notified as soon as your request is approved'
              }
            </p>
          </div>
        )}

        <button onClick={signOut}
          className="w-full flex items-center justify-center gap-2 glass rounded-xl py-3 text-white/60 hover:text-white hover:bg-white/10 transition-all">
          <LogOut className="w-4 h-4" />
          {t('logout')}
        </button>
      </div>
    </div>
  );
}
