import React, { useEffect, useState, useRef } from 'react';
import { supabase, Subject, Lesson, StudentLessonProgress } from '../../lib/supabase';
import { useLang } from '../../lib/lang';
import { useAuth } from '../../lib/auth';
import AiChatWidget from '../../components/AiChatWidget';
import HelpTicketModal from '../../components/HelpTicketModal';
import ReligionSelector from '../../components/ReligionSelector';
import {
  Lock, CheckCircle, PlayCircle, ChevronRight, BookOpen, Bell,
  Star, Heart, FlaskConical, Calculator, Globe, Trophy, Zap, Send
} from 'lucide-react';

type StudentTab = 'home' | 'lessons' | 'notifications' | 'tickets';
interface Props { activeTab: StudentTab }

export default function StudentDashboard({ activeTab }: Props) {
  return (
    <div className="animate-fade-in">
      {activeTab === 'home' && <StudentHome />}
      {activeTab === 'lessons' && <StudentLessons />}
      {activeTab === 'notifications' && <StudentNotifications />}
      {activeTab === 'tickets' && <StudentTickets />}
    </div>
  );
}

// ─── Home ────────────────────────────────────────────────────────────────────
function StudentHome() {
  const { t, lang } = useLang();
  const { profile, refreshProfile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [attempts, setAttempts] = useState<Record<string, boolean>>({});
  const [ticketOpen, setTicketOpen] = useState(false);
  const [showReligion, setShowReligion] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (profile?.religion_enabled && !profile.religion_prompt_shown && !profile.religion_choice) {
      setShowReligion(true);
    }
  }, [profile]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIdx(i => (i + 1) % Math.max(1, banners.length));
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    async function load() {
      const [subRes, bannerRes, progressRes, attemptRes, notifRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('is_active', true).order('order_index'),
        supabase.from('banners').select('*').eq('is_active', true).order('order_index'),
        supabase.from('student_lesson_progress').select('lesson_id, completed').eq('student_id', profile?.id || '').eq('completed', true),
        supabase.from('student_quiz_attempts').select('quiz_id, passed').eq('student_id', profile?.id || '').eq('passed', true),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).or(`recipient_id.eq.${profile?.id},is_global.eq.true`).eq('is_read', false),
      ]);
      setSubjects((subRes.data || []).filter(s => {
        if (s.is_religion) {
          if (!profile?.religion_enabled) return false;
          if (profile.religion_choice === 'islamic' && s.name_en !== 'Islamic Education') return false;
          if (profile.religion_choice === 'christian' && s.name_en !== 'Christian Education') return false;
        }
        return true;
      }));
      setBanners(bannerRes.data || []);
      const pMap: Record<string, boolean> = {};
      (progressRes.data || []).forEach(p => { pMap[p.lesson_id] = true; });
      setProgress(pMap);
      const aMap: Record<string, boolean> = {};
      (attemptRes.data || []).forEach(a => { aMap[a.quiz_id] = true; });
      setAttempts(aMap);
      setNotifCount(notifRes.count || 0);
    }
    if (profile?.id) load();
  }, [profile]);

  const currentBanner = banners[bannerIdx] || null;
  const iconMap: Record<string, React.ReactNode> = {
    'FlaskConical': <FlaskConical className="w-6 h-6 text-white" />,
    'BookOpen': <BookOpen className="w-6 h-6 text-white" />,
    'Globe': <Globe className="w-6 h-6 text-white" />,
    'Calculator': <Calculator className="w-6 h-6 text-white" />,
    'Star': <Star className="w-6 h-6 text-white" />,
    'Heart': <Heart className="w-6 h-6 text-white" />,
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      {/* Religion selector modal */}
      {showReligion && (
        <ReligionSelector
          onSelect={async (choice) => {
            await supabase.from('profiles').update({ religion_choice: choice, religion_prompt_shown: true }).eq('id', profile?.id);
            await refreshProfile();
            setShowReligion(false);
          }}
          onClose={() => setShowReligion(false)}
        />
      )}

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/50 text-sm">{lang === 'ar' ? 'مرحباً،' : 'Welcome back,'}</p>
          <h1 className="text-xl font-bold text-white">{profile?.full_name?.split(' ')[0]} 👋</h1>
        </div>
        <div className="relative">
          <button className="p-2 glass rounded-xl text-white/60 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          {notifCount > 0 && (
            <span className="absolute -top-1 -end-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {notifCount}
            </span>
          )}
        </div>
      </div>

      {/* Banner */}
      {currentBanner && (
        <div className="relative rounded-2xl overflow-hidden h-44 lg:h-56">
          {currentBanner.image_url && (
            <img src={currentBanner.image_url} alt="" className="w-full h-full object-cover absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-5">
            <h2 className="text-lg font-bold text-white leading-tight">
              {lang === 'ar' ? currentBanner.title_ar : currentBanner.title_en}
            </h2>
            {currentBanner.subtitle_ar && (
              <p className="text-white/60 text-sm mt-1">
                {lang === 'ar' ? currentBanner.subtitle_ar : currentBanner.subtitle_en}
              </p>
            )}
          </div>
          {banners.length > 1 && (
            <div className="absolute bottom-3 end-4 flex gap-1.5">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === bannerIdx ? 'bg-white w-4' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3D Student mascot greeting */}
      {!currentBanner && (
        <div className="glass-card p-5 flex items-center gap-4 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-transparent" />
          <div className="relative w-20 h-20 animate-float-slow shrink-0">
            <StudentMascot />
          </div>
          <div className="relative flex-1">
            <h2 className="font-bold text-white text-lg">
              {lang === 'ar' ? `أهلاً ${profile?.full_name?.split(' ')[0]}!` : `Hello ${profile?.full_name?.split(' ')[0]}!`}
            </h2>
            <p className="text-white/60 text-sm mt-1">
              {lang === 'ar' ? 'استمر في رحلتك التعليمية اليوم' : 'Continue your learning journey today'}
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: lang === 'ar' ? 'الدروس' : 'Lessons', value: Object.keys(progress).length, icon: <BookOpen className="w-4 h-4" />, color: 'from-primary-600 to-primary-800' },
          { label: lang === 'ar' ? 'الاختبارات' : 'Quizzes', value: Object.keys(attempts).length, icon: <CheckCircle className="w-4 h-4" />, color: 'from-emerald-600 to-emerald-800' },
          { label: lang === 'ar' ? 'المواد' : 'Subjects', value: subjects.filter(s => !s.is_religion).length, icon: <Trophy className="w-4 h-4" />, color: 'from-amber-600 to-amber-800' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-3 text-center">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mx-auto mb-2`}>
              {s.icon}
            </div>
            <div className="text-lg font-bold text-white">{s.value}</div>
            <div className="text-white/40 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Subject cards */}
      <div>
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary-400" />
          {lang === 'ar' ? 'مساراتك التعليمية' : 'Your Learning Paths'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {subjects.map((sub) => {
            const unlocked = sub.order_index === 1;
            return (
              <SubjectCard key={sub.id} subject={sub} unlocked={unlocked} icon={iconMap[sub.icon]} lang={lang} />
            );
          })}
        </div>
      </div>

      {/* AI Chat + Ticket */}
      <AiChatWidget onOpenTicket={() => setTicketOpen(true)} />
      {ticketOpen && <HelpTicketModal onClose={() => setTicketOpen(false)} />}
    </div>
  );
}

function SubjectCard({ subject, unlocked, icon, lang }: {
  subject: Subject; unlocked: boolean; icon: React.ReactNode; lang: string;
}) {
  return (
    <div className={`relative rounded-2xl overflow-hidden p-4 cursor-pointer transition-all duration-300 ${
      unlocked ? 'hover:scale-[1.03]' : 'opacity-70'
    }`} style={{
      background: unlocked
        ? `linear-gradient(135deg, ${subject.color_from}, ${subject.color_to})`
        : 'rgba(255,255,255,0.05)',
      boxShadow: unlocked ? `0 8px 30px ${subject.color_from}40` : 'none',
      border: `1px solid ${unlocked ? subject.color_from + '60' : 'rgba(255,255,255,0.1)'}`,
    }}>
      {/* Shine */}
      {unlocked && <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />}
      <div className="relative">
        <div className="flex items-start justify-between mb-8">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {icon}
          </div>
          {!unlocked && (
            <div className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center">
              <Lock3D size={18} />
            </div>
          )}
          {unlocked && (
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>
        <div className="font-bold text-white text-sm leading-tight">
          {lang === 'ar' ? subject.name_ar : subject.name_en}
        </div>
        <div className="text-white/60 text-xs mt-0.5">
          {unlocked ? (lang === 'ar' ? 'متاح' : 'Available') : (lang === 'ar' ? 'مقفول' : 'Locked')}
        </div>
      </div>
    </div>
  );
}

function Lock3D({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 120">
      <path d="M30 55 Q30 20 50 20 Q70 20 70 55" stroke="#94a3b8" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <rect x="15" y="53" width="70" height="55" rx="10" fill="#334155"/>
      <rect x="18" y="56" width="64" height="49" rx="9" fill="#475569"/>
      <circle cx="50" cy="75" r="9" fill="#1e293b"/>
      <rect x="46" y="75" width="8" height="13" rx="2" fill="#1e293b"/>
      <ellipse cx="38" cy="63" rx="8" ry="4" fill="white" opacity="0.12" transform="rotate(-30 38 63)"/>
    </svg>
  );
}

function StudentMascot() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <circle cx="60" cy="70" r="30" fill="#1e40af" opacity="0.3"/>
      <rect x="38" y="65" width="44" height="38" rx="8" fill="#2563eb"/>
      <circle cx="60" cy="52" r="22" fill="#fbbf24"/>
      <circle cx="52" cy="49" r="3.5" fill="#1e293b"/>
      <circle cx="68" cy="49" r="3.5" fill="#1e293b"/>
      <circle cx="53" cy="47.5" r="1.2" fill="white"/>
      <circle cx="69" cy="47.5" r="1.2" fill="white"/>
      <path d="M53 58 Q60 63 67 58" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <rect x="28" y="55" width="20" height="26" rx="3" fill="#ef4444"/>
      <rect x="32" y="59" width="12" height="1.5" rx="1" fill="white" opacity="0.6"/>
      <rect x="32" y="62" width="9" height="1.5" rx="1" fill="white" opacity="0.4"/>
      <rect x="32" y="65" width="11" height="1.5" rx="1" fill="white" opacity="0.4"/>
      <ellipse cx="60" cy="33" rx="26" ry="6" fill="#1e293b"/>
      <rect x="50" y="20" width="20" height="14" fill="#1e293b"/>
      <rect x="86" y="35" width="6" height="6" rx="1" fill="#fbbf24"/>
    </svg>
  );
}

// ─── Lessons ─────────────────────────────────────────────────────────────────
function StudentLessons() {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selected, setSelected] = useState<Subject | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, StudentLessonProgress>>({});
  const [watchingLesson, setWatchingLesson] = useState<Lesson | null>(null);
  const msgEndRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('subjects').select('*').eq('is_active', true).order('order_index')
      .then(({ data }) => setSubjects((data || []).filter(s => {
        if (s.is_religion) return profile?.religion_enabled && profile.religion_choice;
        return true;
      })));
  }, [profile]);

  useEffect(() => {
    if (!selected || !profile) return;
    Promise.all([
      supabase.from('lessons').select('*').eq('subject_id', selected.id).eq('is_active', true).order('order_index'),
      supabase.from('student_lesson_progress').select('*').eq('student_id', profile.id).then(({ data }) => {
        const map: Record<string, StudentLessonProgress> = {};
        (data || []).forEach(p => { map[p.lesson_id] = p; });
        return map;
      }),
    ]).then(([lessonsRes, progressMap]) => {
      setLessons(lessonsRes.data || []);
      setLessonProgress(progressMap);
    });
  }, [selected, profile]);

  async function markComplete(lessonId: string) {
    if (!profile) return;
    await supabase.from('student_lesson_progress').upsert({
      student_id: profile.id,
      lesson_id: lessonId,
      completed: true,
      watch_percentage: 100,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'student_id,lesson_id' });
    const { data } = await supabase.from('student_lesson_progress').select('*').eq('student_id', profile.id);
    const map: Record<string, StudentLessonProgress> = {};
    (data || []).forEach((p: StudentLessonProgress) => { map[p.lesson_id] = p; });
    setLessonProgress(map);
    setWatchingLesson(null);
  }

  function isLessonUnlocked(_lesson: Lesson, index: number): boolean {
    if (index === 0) return true;
    const prevLesson = lessons[index - 1];
    return !!lessonProgress[prevLesson.id]?.completed;
  }

  if (watchingLesson) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setWatchingLesson(null)} className="p-2 glass rounded-xl text-white/60 hover:text-white">
            <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? '' : 'rotate-180'}`} />
          </button>
          <h2 className="font-bold text-white">{lang === 'ar' ? watchingLesson.title_ar : watchingLesson.title_en}</h2>
        </div>

        <div className="glass-card overflow-hidden">
          {watchingLesson.video_url ? (
            <div className="aspect-video bg-black">
              <iframe src={watchingLesson.video_url} className="w-full h-full" allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
          ) : (
            <div className="aspect-video bg-navy-900 flex items-center justify-center">
              <div className="text-center">
                <PlayCircle className="w-16 h-16 text-primary-400 mx-auto mb-3 animate-pulse" />
                <p className="text-white/40">{lang === 'ar' ? 'الفيديو غير متوفر' : 'Video not available'}</p>
              </div>
            </div>
          )}
          <div className="p-5">
            <h3 className="font-bold text-white text-lg">{lang === 'ar' ? watchingLesson.title_ar : watchingLesson.title_en}</h3>
            <p className="text-white/60 text-sm mt-2">{lang === 'ar' ? watchingLesson.description_ar : watchingLesson.description_en}</p>
            <button onClick={() => markComplete(watchingLesson.id)}
              className="mt-4 premium-btn w-full flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {lessonProgress[watchingLesson.id]?.completed ? t('completedLesson') : t('continueLesson')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="p-2 glass rounded-xl text-white/60 hover:text-white">
            <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? '' : 'rotate-180'}`} />
          </button>
          <h2 className="font-bold text-white">{lang === 'ar' ? selected.name_ar : selected.name_en}</h2>
        </div>

        <div className="space-y-3">
          {lessons.map((lesson, idx) => {
            const unlocked = isLessonUnlocked(lesson, idx);
            const completed = !!lessonProgress[lesson.id]?.completed;
            return (
              <div key={lesson.id} onClick={() => unlocked && setWatchingLesson(lesson)}
                className={`glass-card p-4 flex items-center gap-4 transition-all duration-200 ${
                  unlocked ? 'cursor-pointer hover:border-white/25 hover:scale-[1.01]' : 'opacity-50 cursor-not-allowed'
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  completed ? 'bg-emerald-500/20' : unlocked ? `bg-gradient-to-br` : 'bg-white/10'
                }`} style={!completed && unlocked ? { background: `linear-gradient(135deg, ${selected.color_from}, ${selected.color_to})` } : {}}>
                  {completed ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                    unlocked ? <PlayCircle className="w-5 h-5 text-white" /> :
                    <Lock className="w-5 h-5 text-white/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm">{lang === 'ar' ? lesson.title_ar : lesson.title_en}</div>
                  <div className="text-white/40 text-xs mt-0.5">
                    {lesson.duration_minutes > 0 ? `${lesson.duration_minutes} ${lang === 'ar' ? 'دقيقة' : 'min'}` : ''}
                    {!unlocked && ` · ${t('lockedLesson')}`}
                    {completed && ` · ${t('completedLesson')}`}
                  </div>
                </div>
                {unlocked && <ChevronRight className={`w-4 h-4 text-white/30 ${lang === 'ar' ? 'rotate-180' : ''}`} />}
              </div>
            );
          })}
          {lessons.length === 0 && (
            <div className="glass-card p-10 text-center text-white/30">{t('noData')}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">{t('myLessons')}</h1>
      <div className="grid grid-cols-2 gap-3">
        {subjects.map(sub => (
          <div key={sub.id} onClick={() => setSelected(sub)}
            className="relative rounded-2xl overflow-hidden p-4 cursor-pointer hover:scale-[1.03] transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${sub.color_from}, ${sub.color_to})`,
              boxShadow: `0 8px 30px ${sub.color_from}40`,
            }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
            <div className="relative">
              <BookOpen className="w-8 h-8 text-white/80 mb-3" />
              <div className="font-bold text-white">{lang === 'ar' ? sub.name_ar : sub.name_en}</div>
              <div className="text-white/60 text-xs mt-1">{lang === 'ar' ? 'اضغط للمتابعة' : 'Tap to continue'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────
function StudentNotifications() {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase.from('notifications')
      .select('*')
      .or(`recipient_id.eq.${profile.id},is_global.eq.true`)
      .order('created_at', { ascending: false })
      .then(({ data }) => setNotifs(data || []));
  }, [profile]);

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  const typeIcon = {
    info: '💡', success: '✅', warning: '⚠️', alert: '🔔',
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <h1 className="text-2xl font-bold text-white">{t('notifications')}</h1>
      <div className="space-y-3">
        {notifs.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">{t('noData')}</p>
          </div>
        ) : (
          notifs.map(n => (
            <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
              className={`glass-card p-4 cursor-pointer transition-all ${!n.is_read ? 'border-primary-500/30 bg-primary-500/5' : ''}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{typeIcon[n.type as keyof typeof typeIcon] || '🔔'}</span>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{lang === 'ar' ? n.title_ar : n.title_en}</div>
                  <div className="text-white/60 text-xs mt-1">{lang === 'ar' ? n.body_ar : n.body_en}</div>
                  <div className="text-white/30 text-xs mt-2">{new Date(n.created_at).toLocaleString(lang === 'ar' ? 'ar-SY' : 'en-US')}</div>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-400 shrink-0 mt-1" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Tickets ─────────────────────────────────────────────────────────────────
function StudentTickets() {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgText, setMsgText] = useState('');
  const [showNew, setShowNew] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  async function loadTickets() {
    if (!profile) return;
    const { data } = await supabase.from('help_tickets').select('*').eq('student_id', profile.id).order('created_at', { ascending: false });
    setTickets(data || []);
  }

  useEffect(() => { loadTickets(); }, [profile]);

  async function openTicket(tk: any) {
    setSelected(tk);
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', tk.id).order('created_at');
    setMessages(data || []);
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function sendMessage() {
    if (!msgText.trim() || !selected || !profile) return;
    await supabase.from('ticket_messages').insert({
      ticket_id: selected.id,
      sender_id: profile.id,
      sender_role: 'student',
      message: msgText.trim(),
    });
    setMsgText('');
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', selected.id).order('created_at');
    setMessages(data || []);
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelected(null); loadTickets(); }} className="p-2 glass rounded-xl text-white/60 hover:text-white">
            <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? '' : 'rotate-180'}`} />
          </button>
          <div>
            <h2 className="font-bold text-white">{selected.title}</h2>
            <span className={selected.status === 'open' ? 'badge-danger' : selected.status === 'in_progress' ? 'badge-warning' : 'badge-success'}>
              {selected.status}
            </span>
          </div>
        </div>

        <div className="glass-card p-4 h-80 overflow-y-auto space-y-3">
          {messages.map(m => (
            <div key={m.id} className={`flex gap-2 ${m.sender_role === 'student' ? 'justify-end' : ''}`}>
              {m.sender_role !== 'student' && (
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs text-white shrink-0">T</div>
              )}
              <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                m.sender_role === 'student' ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white/10 text-white/80 rounded-tl-sm'
              }`}>
                {m.message}
                <div className="text-xs opacity-50 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
              {m.sender_role === 'student' && (
                <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs text-white shrink-0">S</div>
              )}
            </div>
          ))}
          <div ref={msgEndRef} />
        </div>

        {selected.status !== 'closed' && (
          <div className="flex gap-2">
            <input value={msgText} onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="input-field flex-1" placeholder={t('sendMessage') + '...'} />
            <button onClick={sendMessage} className="premium-btn px-4">
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('tickets')}</h1>
        <button onClick={() => setShowNew(true)} className="premium-btn flex items-center gap-2 text-sm">
          <BookOpen className="w-4 h-4" /> {t('openTicket')}
        </button>
      </div>

      {showNew && <NewTicketForm profile={profile} onClose={() => { setShowNew(false); loadTickets(); }} />}

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="glass-card p-10 text-center text-white/30">{t('noData')}</div>
        ) : (
          tickets.map(tk => (
            <div key={tk.id} onClick={() => openTicket(tk)}
              className="glass-card p-4 cursor-pointer hover:border-white/25 hover:scale-[1.01] transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{tk.title}</div>
                  <div className="text-white/40 text-xs">{new Date(tk.created_at).toLocaleString(lang === 'ar' ? 'ar-SY' : 'en-US')}</div>
                </div>
                <span className={tk.status === 'open' ? 'badge-danger' : tk.status === 'in_progress' ? 'badge-warning' : 'badge-success'}>
                  {tk.status === 'open' ? t('ticketOpen') : tk.status === 'in_progress' ? t('ticketInProgress') : t('ticketClosed')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NewTicketForm({ profile, onClose }: { profile: any; onClose: () => void }) {
  const { t, lang } = useLang();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!title.trim() || !profile) return;
    setLoading(true);
    await supabase.from('help_tickets').insert({
      student_id: profile.id,
      title: title.trim(),
      priority,
      status: 'open',
    });
    onClose();
    setLoading(false);
  }

  return (
    <div className="glass-card p-5 animate-slide-up space-y-4">
      <h3 className="font-bold text-white">{t('openTicket')}</h3>
      <div>
        <label className="text-white/50 text-sm mb-1 block">{t('ticketTitle')}</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder={t('ticketTitle')} />
      </div>
      <div>
        <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'الأولوية' : 'Priority'}</label>
        <select value={priority} onChange={e => setPriority(e.target.value)} className="input-field">
          <option value="low">{lang === 'ar' ? 'منخفض' : 'Low'}</option>
          <option value="normal">{lang === 'ar' ? 'عادي' : 'Normal'}</option>
          <option value="high">{lang === 'ar' ? 'عالي' : 'High'}</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={loading} className="premium-btn">{t('submit')}</button>
        <button onClick={onClose} className="premium-btn-outline">{t('cancel')}</button>
      </div>
    </div>
  );
}
