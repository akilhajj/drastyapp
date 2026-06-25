import React, { useEffect, useState } from 'react';
import { supabase, Profile, Banner, CurriculumPdf, Subject } from '../../lib/supabase';
import { useLang } from '../../lib/lang';
import { useAuth } from '../../lib/auth';
import {
  Users, GraduationCap, Ticket, Bell, Check, X, Upload, Plus,
  BarChart3, Image, FileText, BookOpen, Star, Trash2, Edit3,
  AlertCircle, Send, Eye, Lock, Unlock, ChevronRight, RefreshCw
} from 'lucide-react';

type AdminTab = 'dashboard' | 'students' | 'teachers' | 'curriculum' | 'subjects' | 'banners' | 'notifications' | 'reports';

interface AdminDashboardProps {
  activeTab: AdminTab;
}

export default function AdminDashboard({ activeTab }: AdminDashboardProps) {
  const { t, lang } = useLang();

  return (
    <div className="animate-fade-in">
      {activeTab === 'dashboard' && <AdminOverview />}
      {activeTab === 'students' && <AdminStudents />}
      {activeTab === 'teachers' && <AdminTeachers />}
      {activeTab === 'curriculum' && <AdminCurriculum />}
      {activeTab === 'subjects' && <AdminSubjects />}
      {activeTab === 'banners' && <AdminBanners />}
      {activeTab === 'notifications' && <AdminNotifications />}
      {activeTab === 'reports' && <AdminReports />}
    </div>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────
function AdminOverview() {
  const { t, lang } = useLang();
  const [stats, setStats] = useState({ students: 0, teachers: 0, pending: 0, openTickets: 0, closedTickets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [stuRes, teachRes, pendRes, openTRes, closedTRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('help_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('help_tickets').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
      ]);
      setStats({
        students: stuRes.count || 0,
        teachers: teachRes.count || 0,
        pending: pendRes.count || 0,
        openTickets: openTRes.count || 0,
        closedTickets: closedTRes.count || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: t('activeStudents'), value: stats.students, icon: Users, color: 'from-primary-600 to-primary-800', glow: 'rgba(37,99,235,0.4)' },
    { label: t('totalTeachers'), value: stats.teachers, icon: GraduationCap, color: 'from-emerald-600 to-emerald-800', glow: 'rgba(5,150,105,0.4)' },
    { label: t('pendingStudents'), value: stats.pending, icon: AlertCircle, color: 'from-amber-600 to-amber-800', glow: 'rgba(217,119,6,0.4)' },
    { label: t('openTickets'), value: stats.openTickets, icon: Ticket, color: 'from-red-600 to-red-800', glow: 'rgba(220,38,38,0.4)' },
    { label: t('closedTickets'), value: stats.closedTickets, icon: Check, color: 'from-teal-600 to-teal-800', glow: 'rgba(13,148,136,0.4)' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('dashboard')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-card p-5 group hover:scale-105 transition-all duration-300"
              style={{ boxShadow: `0 4px 30px ${c.glow}` }}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">
                {loading ? <div className="h-7 w-12 shimmer-bg rounded" /> : c.value}
              </div>
              <div className="text-white/50 text-xs mt-0.5">{c.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <RecentPendingStudents />
        <RecentTickets />
      </div>
    </div>
  );
}

function RecentPendingStudents() {
  const { t, lang } = useLang();
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5);
    setStudents(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    await supabase.from('profiles').update({ status: 'active' }).eq('id', id);
    load();
  }
  async function reject(id: string) {
    await supabase.from('profiles').update({ status: 'rejected' }).eq('id', id);
    load();
  }

  return (
    <div className="glass-card p-5">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-400" />
        {t('pendingStudents')}
      </h3>
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 shimmer-bg rounded-lg" />)}
        </div>
      ) : students.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-6">{t('noData')}</p>
      ) : (
        <div className="space-y-2">
          {students.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                {s.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{s.full_name}</div>
                <div className="text-xs text-white/40 truncate">{s.email}</div>
              </div>
              <div className="flex gap-1">
                {s.payment_receipt_url && (
                  <a href={s.payment_receipt_url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30">
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                )}
                <button onClick={() => approve(s.id)}
                  className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => reject(s.id)}
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentTickets() {
  const { t, lang } = useLang();
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('help_tickets').select('*, profiles!help_tickets_student_id_fkey(full_name)')
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setTickets(data || []));
  }, []);

  const statusColor = { open: 'badge-danger', in_progress: 'badge-warning', closed: 'badge-success' };
  const statusLabel = { open: t('ticketOpen'), in_progress: t('ticketInProgress'), closed: t('ticketClosed') };

  return (
    <div className="glass-card p-5">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Ticket className="w-4 h-4 text-primary-400" />
        {t('tickets')}
      </h3>
      {tickets.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-6">{t('noData')}</p>
      ) : (
        <div className="space-y-2">
          {tickets.map(tk => (
            <div key={tk.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{tk.title}</div>
                <div className="text-xs text-white/40">{(tk.profiles as any)?.full_name}</div>
              </div>
              <span className={statusColor[tk.status as keyof typeof statusColor]}>
                {statusLabel[tk.status as keyof typeof statusLabel]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Students ────────────────────────────────────────────────────────────────
function AdminStudents() {
  const { t, lang } = useLang();
  const [students, setStudents] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);

  async function load() {
    let q = supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setStudents(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function updateStatus(id: string, status: string) {
    await supabase.from('profiles').update({ status }).eq('id', id);
    load();
  }

  async function toggleReligion(id: string, current: boolean) {
    await supabase.from('profiles').update({ religion_enabled: !current }).eq('id', id);
    load();
  }

  const filters = ['all', 'pending', 'active', 'rejected'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('students')}</h1>
        <button onClick={load} className="p-2 glass rounded-xl text-white/60 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f as any)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              filter === f ? 'bg-primary-600 text-white' : 'glass text-white/60 hover:text-white'
            }`}>
            {f === 'all' ? t('all') : f === 'pending' ? t('pendingApproval') : f === 'active' ? t('active') : t('rejectedMessage').split('.')[0]}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{t('fullName')}</th>
                <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{t('email')}</th>
                <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{t('status')}</th>
                <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{t('enableReligion')}</th>
                <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-5 shimmer-bg rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-white/30">{t('noData')}</td></tr>
              ) : (
                students.map(s => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {s.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm text-white font-medium">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/60 text-sm">{s.email}</td>
                    <td className="py-3 px-4">
                      <span className={
                        s.status === 'active' ? 'badge-success' :
                        s.status === 'pending' ? 'badge-warning' : 'badge-danger'
                      }>
                        {s.status === 'active' ? t('active') : s.status === 'pending' ? t('pendingApproval') : 'Rejected'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleReligion(s.id, s.religion_enabled)}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${s.religion_enabled ? 'bg-emerald-500' : 'bg-white/20'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${s.religion_enabled ? (lang === 'ar' ? 'right-0.5' : 'left-4') : (lang === 'ar' ? 'right-4' : 'left-0.5')}`} />
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {s.payment_receipt_url && (
                          <a href={s.payment_receipt_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 text-xs">
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {s.status !== 'active' && (
                          <button onClick={() => updateStatus(s.id, 'active')}
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {s.status !== 'rejected' && (
                          <button onClick={() => updateStatus(s.id, 'rejected')}
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Teachers ───────────────────────────────────────────────────────────────
function AdminTeachers() {
  const { t, lang } = useLang();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [ticketStats, setTicketStats] = useState<Record<string, { opened: number; closed: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: teacherData } = await supabase.from('profiles').select('*').eq('role', 'teacher');
      setTeachers(teacherData || []);
      const statsMap: Record<string, { opened: number; closed: number }> = {};
      for (const teacher of (teacherData || [])) {
        const [openedRes, closedRes] = await Promise.all([
          supabase.from('help_tickets').select('id', { count: 'exact', head: true }).eq('assigned_teacher_id', teacher.id),
          supabase.from('help_tickets').select('id', { count: 'exact', head: true }).eq('closed_by', teacher.id).eq('status', 'closed'),
        ]);
        statsMap[teacher.id] = { opened: openedRes.count || 0, closed: closedRes.count || 0 };
      }
      setTicketStats(statsMap);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">{t('teachers')}</h1>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{t('fullName')}</th>
                <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{t('email')}</th>
                <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{t('totalOpened')}</th>
                <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{t('totalClosed')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(4)].map((_, j) => <td key={j} className="py-3 px-4"><div className="h-5 shimmer-bg rounded" /></td>)}
                  </tr>
                ))
              ) : teachers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-white/30">{t('noData')}</td></tr>
              ) : (
                teachers.map(tc => (
                  <tr key={tc.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {tc.full_name?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                        <span className="text-sm text-white font-medium">{tc.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/60 text-sm">{tc.email}</td>
                    <td className="py-3 px-4">
                      <span className="badge badge-warning">{ticketStats[tc.id]?.opened ?? 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge badge-success">{ticketStats[tc.id]?.closed ?? 0}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Curriculum PDFs ─────────────────────────────────────────────────────────
function AdminCurriculum() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pdfs, setPdfs] = useState<CurriculumPdf[]>([]);
  const [form, setForm] = useState({ subject_id: '', title_ar: '', title_en: '', file_url: '', version: '' });
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('subjects').select('*').eq('is_active', true).order('order_index').then(({ data }) => setSubjects(data || []));
    supabase.from('curriculum_pdfs').select('*').order('created_at', { ascending: false }).then(({ data }) => setPdfs(data || []));
  }, []);

  async function addPdf() {
    if (!form.subject_id || !form.title_ar || !form.file_url) return;
    setLoading(true);
    await supabase.from('curriculum_pdfs').insert({ ...form, uploaded_by: user?.id });
    const { data } = await supabase.from('curriculum_pdfs').select('*').order('created_at', { ascending: false });
    setPdfs(data || []);
    setForm({ subject_id: '', title_ar: '', title_en: '', file_url: '', version: '' });
    setAdding(false);
    setLoading(false);
  }

  async function deletePdf(id: string) {
    await supabase.from('curriculum_pdfs').delete().eq('id', id);
    setPdfs(pdfs.filter(p => p.id !== id));
  }

  const getSubjectName = (id: string) => {
    const s = subjects.find(s => s.id === id);
    return s ? (lang === 'ar' ? s.name_ar : s.name_en) : '';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('curriculum')}</h1>
        <button onClick={() => setAdding(!adding)} className="premium-btn flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('add')}
        </button>
      </div>

      {adding && (
        <div className="glass-card p-5 animate-slide-up space-y-4">
          <h3 className="font-bold text-white">{t('add')} PDF</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/50 text-sm mb-1 block">{t('subjects')}</label>
              <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="input-field">
                <option value="">-- {lang === 'ar' ? 'اختر المادة' : 'Select Subject'} --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{lang === 'ar' ? s.name_ar : s.name_en}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'الإصدار' : 'Version'}</label>
              <input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} className="input-field" placeholder="v1.0" />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
              <input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'}</label>
              <input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/50 text-sm mb-1 block">PDF URL</label>
              <input value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} className="input-field" placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addPdf} disabled={loading} className="premium-btn">{t('save')}</button>
            <button onClick={() => setAdding(false)} className="premium-btn-outline">{t('cancel')}</button>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{t('subjects')}</th>
              <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{lang === 'ar' ? 'العنوان' : 'Title'}</th>
              <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{lang === 'ar' ? 'الإصدار' : 'Version'}</th>
              <th className="text-start py-3 px-4 text-white/50 text-xs font-medium">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {pdfs.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-white/30">{t('noData')}</td></tr>
            ) : (
              pdfs.map(pdf => (
                <tr key={pdf.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-3 px-4 text-sm text-white/70">{getSubjectName(pdf.subject_id)}</td>
                  <td className="py-3 px-4 text-sm text-white">{lang === 'ar' ? pdf.title_ar : pdf.title_en}</td>
                  <td className="py-3 px-4"><span className="badge badge-info">{pdf.version || 'N/A'}</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <a href={pdf.file_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => deletePdf(pdf.id)}
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Subjects ────────────────────────────────────────────────────────────────
function AdminSubjects() {
  const { t, lang } = useLang();
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    supabase.from('subjects').select('*').order('order_index').then(({ data }) => setSubjects(data || []));
  }, []);

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('subjects').update({ is_active: !current }).eq('id', id);
    setSubjects(s => s.map(sub => sub.id === id ? { ...sub, is_active: !current } : sub));
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">{t('subjects')}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(sub => (
          <div key={sub.id} className="glass-card p-5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className="absolute inset-0 opacity-20 rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${sub.color_from}, ${sub.color_to})` }} />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="font-bold text-white">{lang === 'ar' ? sub.name_ar : sub.name_en}</div>
                <div className="text-white/50 text-xs mt-1">{lang === 'ar' ? sub.name_en : sub.name_ar}</div>
                {sub.is_religion && <span className="badge badge-info mt-1">{lang === 'ar' ? 'دين' : 'Religion'}</span>}
              </div>
              <button onClick={() => toggleActive(sub.id, sub.is_active)}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${sub.is_active ? 'bg-emerald-500' : 'bg-white/20'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${sub.is_active ? (lang === 'ar' ? 'right-0.5' : 'left-4') : (lang === 'ar' ? 'right-4' : 'left-0.5')}`} />
              </button>
            </div>
            <div className="mt-3 text-xs text-white/40">
              {lang === 'ar' ? `الترتيب: ${sub.order_index}` : `Order: ${sub.order_index}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Banners ─────────────────────────────────────────────────────────────────
function AdminBanners() {
  const { t, lang } = useLang();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState({ title_ar: '', title_en: '', subtitle_ar: '', subtitle_en: '', image_url: '', order_index: 1 });
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await supabase.from('banners').select('*').order('order_index');
    setBanners(data || []);
  }

  useEffect(() => { load(); }, []);

  async function addBanner() {
    setLoading(true);
    await supabase.from('banners').insert({ ...form, is_active: true });
    await load();
    setForm({ title_ar: '', title_en: '', subtitle_ar: '', subtitle_en: '', image_url: '', order_index: 1 });
    setAdding(false);
    setLoading(false);
  }

  async function deleteBanner(id: string) {
    await supabase.from('banners').delete().eq('id', id);
    setBanners(b => b.filter(x => x.id !== id));
  }

  async function toggleBanner(id: string, current: boolean) {
    await supabase.from('banners').update({ is_active: !current }).eq('id', id);
    setBanners(b => b.map(x => x.id === id ? { ...x, is_active: !current } : x));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('banners')}</h1>
        <button onClick={() => setAdding(!adding)} className="premium-btn flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('add')}
        </button>
      </div>

      {adding && (
        <div className="glass-card p-5 animate-slide-up space-y-4">
          <h3 className="font-bold text-white">{lang === 'ar' ? 'إضافة لافتة' : 'Add Banner'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
              <input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'}</label>
              <input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'الوصف (عربي)' : 'Subtitle (Arabic)'}</label>
              <input value={form.subtitle_ar} onChange={e => setForm({ ...form, subtitle_ar: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'الوصف (إنجليزي)' : 'Subtitle (English)'}</label>
              <input value={form.subtitle_en} onChange={e => setForm({ ...form, subtitle_en: e.target.value })} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'رابط الصورة' : 'Image URL'}</label>
              <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="input-field" placeholder="https://images.pexels.com/..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addBanner} disabled={loading} className="premium-btn">{t('save')}</button>
            <button onClick={() => setAdding(false)} className="premium-btn-outline">{t('cancel')}</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {banners.length === 0 ? (
          <div className="glass-card p-10 text-center text-white/30">{t('noData')}</div>
        ) : (
          banners.map(b => (
            <div key={b.id} className="glass-card p-4 flex items-center gap-4">
              {b.image_url && (
                <img src={b.image_url} className="w-16 h-12 object-cover rounded-lg shrink-0" alt="" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white">{lang === 'ar' ? b.title_ar : b.title_en}</div>
                <div className="text-white/40 text-sm truncate">{lang === 'ar' ? b.subtitle_ar : b.subtitle_en}</div>
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={() => toggleBanner(b.id, b.is_active)}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${b.is_active ? 'bg-emerald-500' : 'bg-white/20'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${b.is_active ? (lang === 'ar' ? 'right-0.5' : 'left-4') : (lang === 'ar' ? 'right-4' : 'left-0.5')}`} />
                </button>
                <button onClick={() => deleteBanner(b.id)}
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Notifications ───────────────────────────────────────────────────────────
function AdminNotifications() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [form, setForm] = useState({ title_ar: '', title_en: '', body_ar: '', body_en: '', type: 'info' as const });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setNotifs(data || []));
  }, []);

  async function sendGlobal() {
    if (!form.title_ar || !form.body_ar) return;
    setSending(true);
    await supabase.from('notifications').insert({ ...form, is_global: true, sender_id: user?.id });
    setSuccess(true);
    setSending(false);
    setForm({ title_ar: '', title_en: '', body_ar: '', body_en: '', type: 'info' });
    setTimeout(() => setSuccess(false), 3000);
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
    setNotifs(data || []);
  }

  const typeColors = { info: 'badge-info', success: 'badge-success', warning: 'badge-warning', alert: 'badge-danger' };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">{t('notifications')}</h1>

      <div className="glass-card p-5 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Send className="w-4 h-4 text-primary-400" />
          {t('globalNotification')}
        </h3>

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
            {t('success')}!
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
            <input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'}</label>
            <input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'الرسالة (عربي)' : 'Message (Arabic)'}</label>
            <textarea value={form.body_ar} onChange={e => setForm({ ...form, body_ar: e.target.value })} className="input-field" rows={2} />
          </div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'الرسالة (إنجليزي)' : 'Message (English)'}</label>
            <textarea value={form.body_en} onChange={e => setForm({ ...form, body_en: e.target.value })} className="input-field" rows={2} />
          </div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'النوع' : 'Type'}</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="input-field">
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="alert">Alert</option>
            </select>
          </div>
        </div>
        <button onClick={sendGlobal} disabled={sending} className="premium-btn flex items-center gap-2">
          <Send className="w-4 h-4" /> {t('sendNotification')}
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10 font-bold text-white">{lang === 'ar' ? 'الإشعارات المرسلة' : 'Sent Notifications'}</div>
        <div className="divide-y divide-white/5">
          {notifs.length === 0 ? (
            <p className="p-8 text-center text-white/30">{t('noData')}</p>
          ) : (
            notifs.map(n => (
              <div key={n.id} className="p-4 hover:bg-white/3 transition-colors">
                <div className="flex items-start gap-3">
                  <span className={typeColors[n.type as keyof typeof typeColors]}>{n.type}</span>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">{lang === 'ar' ? n.title_ar : n.title_en}</div>
                    <div className="text-white/50 text-xs mt-0.5">{lang === 'ar' ? n.body_ar : n.body_en}</div>
                    {n.is_global && <span className="badge badge-info mt-1">{lang === 'ar' ? 'عام' : 'Global'}</span>}
                  </div>
                  <div className="text-white/30 text-xs">{new Date(n.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SY' : 'en-US')}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reports ─────────────────────────────────────────────────────────────────
function AdminReports() {
  const { t, lang } = useLang();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('ai_chat_logs').select('*, profiles!ai_chat_logs_student_id_fkey(full_name)')
      .order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => setLogs(data || []));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">{t('reports')}</h1>
      <div className="glass-card p-5">
        <h3 className="font-bold text-white mb-4">{lang === 'ar' ? 'سجلات تفاعل الذكاء الاصطناعي' : 'AI Interaction Logs'}</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-center text-white/30 py-8">{t('noData')}</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary-400">{(log.profiles as any)?.full_name}</span>
                  <span className={`badge ${log.mode === 'voice' ? 'badge-warning' : 'badge-info'}`}>{log.mode}</span>
                  <span className="badge badge-info">{log.language}</span>
                  <span className="text-white/30 text-xs ms-auto">{new Date(log.created_at).toLocaleString(lang === 'ar' ? 'ar-SY' : 'en-US')}</span>
                </div>
                <div className="text-white/70 text-xs"><span className="text-white/40">{lang === 'ar' ? 'السؤال:' : 'Q:'}</span> {log.user_message}</div>
                <div className="text-white/50 text-xs mt-1 line-clamp-2"><span className="text-white/40">{lang === 'ar' ? 'الإجابة:' : 'A:'}</span> {log.ai_response}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
