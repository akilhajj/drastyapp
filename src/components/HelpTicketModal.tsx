import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLang } from '../lib/lang';
import { useAuth } from '../lib/auth';
import { X, Ticket } from 'lucide-react';

interface Props { onClose: () => void }

export default function HelpTicketModal({ onClose }: Props) {
  const { t, lang } = useLang();
  const { profile } = useAuth();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-6 max-w-sm w-full animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="font-bold text-white">{t('callTeacher')}</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white/50 text-sm mb-1 block">{t('ticketTitle')}</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="input-field"
              placeholder={lang === 'ar' ? 'صف مشكلتك باختصار...' : 'Describe your issue briefly...'} />
          </div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'الأولوية' : 'Priority'}</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="input-field">
              <option value="low">{lang === 'ar' ? 'منخفض' : 'Low'}</option>
              <option value="normal">{lang === 'ar' ? 'عادي' : 'Normal'}</option>
              <option value="high">{lang === 'ar' ? 'عالي' : 'High'}</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={loading || !title.trim()} className="premium-btn flex-1">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('submit')}
            </button>
            <button onClick={onClose} className="premium-btn-outline">{t('cancel')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
