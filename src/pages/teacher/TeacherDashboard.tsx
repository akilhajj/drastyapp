import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useLang } from '../../lib/lang';
import { useAuth } from '../../lib/auth';
import {
  Ticket, Clock, Lock, CheckCircle, Send, User, Plus, Calendar,
  BarChart3, MessageSquare, Unlock, AlertTriangle, RefreshCw, X
} from 'lucide-react';

type TeacherTab = 'dashboard' | 'tickets' | 'consultations' | 'students' | 'monitoring';

interface TeacherDashboardProps {
  activeTab: TeacherTab;
}

function isShiftActive(): boolean {
  const now = new Date();
  const h = now.getHours();
  return h >= 10 && h < 14;
}

export default function TeacherDashboard({ activeTab }: TeacherDashboardProps) {
  return (
    <div className="animate-fade-in">
      {activeTab === 'dashboard' && <TeacherOverview />}
      {activeTab === 'tickets' && <TeacherTickets />}
      {activeTab === 'consultations' && <TeacherConsultations />}
      {activeTab === 'students' && <TeacherStudentLogs />}
      {activeTab === 'monitoring' && <TeacherMonitoring />}
    </div>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────
function TeacherOverview() {
  const { t, lang } = useLang();
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ open: 0, closed: 0, students: 0 });
  const [shift, setShift] = useState(isShiftActive());

  useEffect(() => {
    const interval = setInterval(() => setShift(isShiftActive()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('help_tickets').select('id', { count: 'exact', head: true }).eq('assigned_teacher_id', user.id),
      supabase.from('help_tickets').select('id', { count: 'exact', head: true }).eq('closed_by', user.id).eq('status', 'closed'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'active'),
    ]).then(([open, closed, stu]) => {
      setStats({ open: open.count || 0, closed: closed.count || 0, students: stu.count || 0 });
    });
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('dashboard')}</h1>

      {/* Shift status banner */}
      <div className={`glass-card p-4 flex items-center gap-4 ${shift ? 'border-emerald-500/40' : 'border-amber-500/40'}`}
        style={{ borderColor: shift ? 'rgba(16,185,129,0.4)' : 'rgba(217,119,6,0.4)' }}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${shift ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
          {shift ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-amber-400" />}
        </div>
        <div>
          <div className={`font-bold text-sm ${shift ? 'text-emerald-400' : 'text-amber-400'}`}>
            {shift ? t('shiftActive') : t('shiftEnded')}
          </div>
          <div className="text-white/40 text-xs">{t('shiftMessage')}</div>
        </div>
        <div className="ms-auto text-white/30 text-sm font-mono">
          {new Date().toLocaleTimeString(lang === 'ar' ? 'ar-SY' : 'en-US')}
        </div>
      </div>

      {/* Ticket stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('totalOpened'), value: stats.open, color: 'from-red-600 to-red-800' },
          { label: t('totalClosed'), value: stats.closed, color: 'from-emerald-600 to-emerald-800' },
          { label: t('activeStudents'), value: stats.students, color: 'from-primary-600 to-primary-800' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
              {i === 0 ? <Ticket className="w-4 h-4 text-white" /> : i === 1 ? <CheckCircle className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
            </div>
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-white/40 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <RecentTickets teacherId={user?.id} />
    </div>
  );
}

function RecentTickets({ teacherId }: { teacherId?: string }) {
  const { t, lang } = useLang();
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (!teacherId) return;
    supabase.from('help_tickets')
      .select('*, profiles!help_tickets_student_id_fkey(full_name)')
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setTickets(data || []));
  }, [teacherId]);

  return (
    <div className="glass-card p-5">
      <h3 className="font-bold text-white mb-4">{lang === 'ar' ? 'التذاكر المعلقة' : 'Pending Tickets'}</h3>
      {tickets.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-6">{t('noData')}</p>
      ) : (
        <div className="space-y-2">
          {tickets.map(tk => (
            <div key={tk.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{tk.title}</div>
                <div className="text-xs text-white/40">{(tk.profiles as any)?.full_name}</div>
              </div>
              <span className={tk.status === 'open' ? 'badge-danger' : 'badge-warning'}>
                {tk.status === 'open' ? t('ticketOpen') : t('ticketInProgress')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tickets ────────────────────────────────────────────────────────────────
function TeacherTickets() {
  const { t, lang } = useLang();
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgText, setMsgText] = useState('');
  const [loading, setLoading] = useState(true);
  const msgEndRef = useRef<HTMLDivElement>(null);

  async function loadTickets() {
    const { data } = await supabase.from('help_tickets')
      .select('*, profiles!help_tickets_student_id_fkey(full_name, email)')
      .neq('status', 'closed')
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  }

  useEffect(() => { loadTickets(); }, []);

  async function openTicket(tk: any) {
    setSelected(tk);
    if (tk.status === 'open') {
      await supabase.from('help_tickets').update({ status: 'in_progress', assigned_teacher_id: user?.id }).eq('id', tk.id);
    }
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', tk.id).order('created_at');
    setMessages(data || []);
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function sendMessage() {
    if (!msgText.trim() || !selected) return;
    await supabase.from('ticket_messages').insert({
      ticket_id: selected.id,
      sender_id: user?.id,
      sender_role: 'teacher',
      message: msgText.trim(),
    });
    setMsgText('');
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', selected.id).order('created_at');
    setMessages(data || []);
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function closeTicket() {
    if (!selected) return;
    await supabase.from('help_tickets').update({ status: 'closed', closed_by: user?.id, closed_at: new Date().toISOString() }).eq('id', selected.id);
    setSelected(null);
    loadTickets();
  }

  if (selected) {
    return (
      <div className="space-y-4 h-full">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelected(null); loadTickets(); }} className="p-2 glass rounded-xl text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h2 className="text-white font-bold">{selected.title}</h2>
            <p className="text-white/40 text-xs">{(selected.profiles as any)?.full_name}</p>
          </div>
          <button onClick={closeTicket} className="premium-btn text-sm flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> {t('resolveTicket')}
          </button>
        </div>

        <div className="glass-card p-4 h-80 overflow-y-auto space-y-3">
          {messages.map(m => (
            <div key={m.id} className={`flex gap-2 ${m.sender_role === 'teacher' ? 'justify-end' : ''}`}>
              {m.sender_role !== 'teacher' && (
                <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs text-white shrink-0">S</div>
              )}
              <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                m.sender_role === 'teacher' ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white/10 text-white/80 rounded-tl-sm'
              }`}>
                {m.message}
                <div className="text-xs opacity-50 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
              {m.sender_role === 'teacher' && (
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs text-white shrink-0">T</div>
              )}
            </div>
          ))}
          <div ref={msgEndRef} />
        </div>

        <div className="flex gap-2">
          <input value={msgText} onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="input-field flex-1" placeholder={t('sendMessage') + '...'} />
          <button onClick={sendMessage} className="premium-btn px-4">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('tickets')}</h1>
        <button onClick={loadTickets} className="p-2 glass rounded-xl text-white/60 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer-bg rounded-2xl" />)
        ) : tickets.length === 0 ? (
          <div className="glass-card p-10 text-center text-white/30">{t('noData')}</div>
        ) : (
          tickets.map(tk => (
            <div key={tk.id} onClick={() => openTicket(tk)}
              className="glass-card p-4 cursor-pointer hover:border-white/25 hover:scale-[1.01] transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">{tk.title}</div>
                  <div className="text-white/50 text-sm">{(tk.profiles as any)?.full_name}</div>
                  <div className="text-white/30 text-xs">{new Date(tk.created_at).toLocaleString(lang === 'ar' ? 'ar-SY' : 'en-US')}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={tk.status === 'open' ? 'badge-danger' : 'badge-warning'}>
                    {tk.status === 'open' ? t('ticketOpen') : t('ticketInProgress')}
                  </span>
                  <span className={`badge ${tk.priority === 'high' ? 'badge-danger' : tk.priority === 'low' ? 'badge-info' : 'badge-warning'}`}>
                    {tk.priority}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Consultations ───────────────────────────────────────────────────────────
function TeacherConsultations() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [slots, setSlots] = useState<any[]>([]);
  const [form, setForm] = useState({ slot_date: '', start_time: '10:00', end_time: '11:00', type: 'text', notes: '' });
  const [adding, setAdding] = useState(false);

  async function load() {
    const { data } = await supabase.from('consultation_slots')
      .select('*, consultation_bookings(id, student_id, status, profiles!consultation_bookings_student_id_fkey(full_name))')
      .eq('teacher_id', user?.id)
      .order('slot_date', { ascending: true });
    setSlots(data || []);
  }

  useEffect(() => { load(); }, [user]);

  async function addSlot() {
    if (!form.slot_date) return;
    await supabase.from('consultation_slots').insert({ ...form, teacher_id: user?.id });
    setForm({ slot_date: '', start_time: '10:00', end_time: '11:00', type: 'text', notes: '' });
    setAdding(false);
    load();
  }

  async function deleteSlot(id: string) {
    await supabase.from('consultation_slots').delete().eq('id', id);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('consultations')}</h1>
        <button onClick={() => setAdding(!adding)} className="premium-btn flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('addSlot')}
        </button>
      </div>

      {adding && (
        <div className="glass-card p-5 animate-slide-up space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/50 text-sm mb-1 block">{t('date')}</label>
              <input type="date" value={form.slot_date} onChange={e => setForm({ ...form, slot_date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'النوع' : 'Type'}</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                <option value="text">{lang === 'ar' ? 'نصي' : 'Text'}</option>
                <option value="video">{lang === 'ar' ? 'فيديو' : 'Video'}</option>
              </select>
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'وقت البداية' : 'Start Time'}</label>
              <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'وقت النهاية' : 'End Time'}</label>
              <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addSlot} className="premium-btn">{t('save')}</button>
            <button onClick={() => setAdding(false)} className="premium-btn-outline">{t('cancel')}</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {slots.length === 0 ? (
          <div className="glass-card p-10 text-center text-white/30">{t('noData')}</div>
        ) : (
          slots.map(slot => (
            <div key={slot.id} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{slot.slot_date}</div>
                  <div className="text-white/50 text-sm">{slot.start_time} – {slot.end_time} · {slot.type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${slot.is_available ? 'badge-success' : 'badge-danger'}`}>
                    {slot.is_available ? (lang === 'ar' ? 'متاح' : 'Available') : (lang === 'ar' ? 'محجوز' : 'Booked')}
                  </span>
                  <button onClick={() => deleteSlot(slot.id)}
                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {slot.consultation_bookings?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  {slot.consultation_bookings.map((b: any) => (
                    <div key={b.id} className="text-sm text-white/60 flex items-center gap-2">
                      <User className="w-3 h-3" />
                      {b.profiles?.full_name} · <span className="badge badge-info">{b.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Student Logs ────────────────────────────────────────────────────────────
function TeacherStudentLogs() {
  const { t, lang } = useLang();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('ai_chat_logs')
      .select('*, profiles!ai_chat_logs_student_id_fkey(full_name)')
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setLogs(data || []));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">{t('studentLogs')}</h1>
      <div className="glass-card p-5">
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-center text-white/30 py-8">{t('noData')}</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary-400">{(log.profiles as any)?.full_name}</span>
                  <span className={`badge ${log.mode === 'voice' ? 'badge-warning' : 'badge-info'}`}>{log.mode}</span>
                  <span className="text-white/30 text-xs ms-auto">{new Date(log.created_at).toLocaleString(lang === 'ar' ? 'ar-SY' : 'en-US')}</span>
                </div>
                <div className="text-white/70 text-xs"><span className="text-white/40">Q:</span> {log.user_message}</div>
                <div className="text-white/50 text-xs mt-1 line-clamp-1"><span className="text-white/40">A:</span> {log.ai_response}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Monitoring (Shift-Gated) ─────────────────────────────────────────────
function TeacherMonitoring() {
  const { t, lang } = useLang();
  const [shift, setShift] = useState(isShiftActive());
  const [attempts, setAttempts] = useState<any[]>([]);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => setShift(isShiftActive()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!shift) return;
    supabase.from('student_quiz_attempts')
      .select('*, profiles!student_quiz_attempts_student_id_fkey(full_name), quizzes(title_ar, title_en)')
      .eq('passed', false)
      .order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => setAttempts(data || []));
  }, [shift]);

  async function unlockQuiz(attemptId: string) {
    setUnlocking(attemptId);
    await supabase.from('student_quiz_attempts').update({
      manually_unlocked: true,
      unlocked_by: user?.id,
      unlocked_at: new Date().toISOString(),
    }).eq('id', attemptId);
    setAttempts(prev => prev.filter(a => a.id !== attemptId));
    setUnlocking(null);
  }

  if (!shift) {
    return (
      <div className="min-h-64 flex flex-col items-center justify-center">
        <div className="glass-card p-10 text-center max-w-md mx-auto">
          <div className="relative w-32 h-32 mx-auto mb-6">
            {/* 3D Lock */}
            <svg viewBox="0 0 200 200" className="w-full h-full animate-float">
              <defs>
                <radialGradient id="lockGrad" cx="50%" cy="30%" r="60%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#b45309" />
                </radialGradient>
                <radialGradient id="lockBodyGrad" cx="50%" cy="20%" r="70%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#1e40af" />
                </radialGradient>
              </defs>
              {/* Shackle */}
              <path d="M70 90 Q70 40 100 40 Q130 40 130 90" stroke="url(#lockGrad)" strokeWidth="14" fill="none" strokeLinecap="round"/>
              {/* Body */}
              <rect x="55" y="88" width="90" height="75" rx="12" fill="url(#lockBodyGrad)"/>
              {/* Keyhole */}
              <circle cx="100" cy="120" r="10" fill="#0f172a" opacity="0.8"/>
              <rect x="96" y="120" width="8" height="18" rx="2" fill="#0f172a" opacity="0.8"/>
              {/* Shine */}
              <ellipse cx="80" cy="100" rx="10" ry="5" fill="white" opacity="0.15" transform="rotate(-30 80 100)"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-amber-400 mb-2">{t('shiftEnded')}</h2>
          <p className="text-white/50 text-sm">{t('shiftMessage')}</p>
          <div className="mt-4 glass rounded-xl px-4 py-2 text-white/60 text-sm inline-block">
            {lang === 'ar' ? 'الوقت الحالي: ' : 'Current time: '}
            <span className="font-mono text-white">{new Date().toLocaleTimeString(lang === 'ar' ? 'ar-SY' : 'en-US')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">{t('monitoringShift')}</h1>
        <span className="badge badge-success animate-pulse-glow">{t('shiftActive')}</span>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          {lang === 'ar' ? 'الاختبارات المفشلة - تحتاج مراجعة' : 'Failed Quiz Attempts - Needs Review'}
        </h3>
        <div className="space-y-3">
          {attempts.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">{lang === 'ar' ? 'لا توجد اختبارات معلقة' : 'No pending quiz issues'}</p>
          ) : (
            attempts.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{(a.profiles as any)?.full_name}</div>
                  <div className="text-xs text-white/40">{lang === 'ar' ? (a.quizzes as any)?.title_ar : (a.quizzes as any)?.title_en}</div>
                  <div className="text-xs text-white/30">{lang === 'ar' ? 'النتيجة: ' : 'Score: '}{a.score}%</div>
                </div>
                <button onClick={() => unlockQuiz(a.id)} disabled={unlocking === a.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium transition-colors">
                  {unlocking === a.id ? (
                    <div className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  {t('unlockQuiz')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
