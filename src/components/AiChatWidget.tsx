import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLang } from '../lib/lang';
import { useAuth } from '../lib/auth';
import { Send, Mic, MicOff, X, Volume2, Ticket, Bot, ChevronDown, ChevronUp } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
  mode?: 'text' | 'voice';
}

interface AiChatProps {
  onOpenTicket: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function AiChatWidget({ onOpenTicket }: AiChatProps) {
  const { t, lang, isRTL } = useLang();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (open) setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages, open]);

  async function sendText() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, mode: 'text' }]);
    setLoading(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMsg, language: lang, mode: 'text' }),
      });

      let aiText = lang === 'ar'
        ? 'أنا مساعدك الذكي. يمكنني مساعدتك في فهم المناهج الدراسية السورية. كيف يمكنني مساعدتك؟'
        : "I'm your AI assistant. I can help you understand the Syrian curriculum. How can I help you?";

      if (response.ok) {
        const data = await response.json();
        if (data.response) aiText = data.response;
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiText, mode: 'text' }]);

      await supabase.from('ai_chat_logs').insert({
        student_id: user?.id,
        mode: 'text',
        user_message: userMsg,
        ai_response: aiText,
        language: lang,
      });
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: lang === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.',
        mode: 'text',
      }]);
    }
    setLoading(false);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = processVoice;
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      alert(lang === 'ar' ? 'تعذر الوصول إلى الميكروفون' : 'Could not access microphone');
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
  }

  async function processVoice() {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: lang === 'ar' ? '🎤 رسالة صوتية' : '🎤 Voice message', mode: 'voice' }]);

    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('language', lang);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: formData,
      });

      let aiText = lang === 'ar'
        ? 'سمعت سؤالك. أنا مساعدك الذكي في تعلم المناهج السورية.'
        : "I heard your question. I'm your AI assistant for the Syrian curriculum.";
      let ttsAudio: string | null = null;

      if (response.ok) {
        const data = await response.json();
        if (data.response) aiText = data.response;
        if (data.audio) ttsAudio = data.audio;
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiText, mode: 'voice' }]);

      if (ttsAudio) {
        const audioData = `data:audio/mp3;base64,${ttsAudio}`;
        setAudioUrl(audioData);
        audioRef.current = new Audio(audioData);
        audioRef.current.play();
      }

      await supabase.from('ai_chat_logs').insert({
        student_id: user?.id,
        mode: 'voice',
        user_message: lang === 'ar' ? 'رسالة صوتية' : 'Voice message',
        ai_response: aiText,
        language: lang,
      });
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: lang === 'ar' ? 'حدث خطأ في معالجة الصوت.' : 'Error processing voice.',
        mode: 'voice',
      }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className={`fixed bottom-20 ${isRTL ? 'left-4' : 'right-4'} z-50 lg:bottom-6 w-14 h-14 rounded-full 
          bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow animate-pulse-glow
          flex items-center justify-center hover:scale-110 transition-transform`}>
          <RobotAvatar size={32} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className={`fixed bottom-20 ${isRTL ? 'left-4' : 'right-4'} z-50 lg:bottom-6 w-80 sm:w-96 
          glass-card flex flex-col overflow-hidden shadow-premium animate-slide-up`}
          style={{ height: '500px', maxHeight: 'calc(100vh - 120px)' }}>

          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary-900/50 to-navy-900/50 flex items-center gap-3 shrink-0">
            <div className="relative">
              <RobotAvatar size={36} />
              <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-navy-900" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-white text-sm">{t('aiAssistant')}</div>
              <div className="text-white/40 text-xs">{lang === 'ar' ? 'متاح 24/7' : 'Available 24/7'}</div>
            </div>
            <div className="flex items-center gap-1">
              {/* Mode toggle */}
              <button onClick={() => setMode(mode === 'text' ? 'voice' : 'text')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${mode === 'voice' ? 'bg-amber-500/20 text-amber-400' : 'text-white/40 hover:text-white hover:bg-white/10'}`}>
                {mode === 'voice' ? <Volume2 className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              <button onClick={onOpenTicket}
                className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title={t('callTeacher')}>
                <Ticket className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <RobotAvatar size={48} className="mx-auto mb-3 animate-float" />
                <p className="text-white/50 text-sm">
                  {lang === 'ar' ? 'مرحباً! أنا مساعدك الذكي. اسألني أي سؤال عن المناهج.' : "Hi! I'm your AI tutor. Ask me anything about the curriculum."}
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'ai' && <RobotAvatar size={24} className="shrink-0 mt-1" />}
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-sm'
                    : 'bg-white/10 text-white/80 rounded-tl-sm'
                }`}>
                  {m.mode === 'voice' && m.role === 'user' && (
                    <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                      <Mic className="w-3 h-3" />
                      {lang === 'ar' ? 'صوتي' : 'Voice'}
                    </div>
                  )}
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <RobotAvatar size={24} className="shrink-0 mt-1" />
                <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>

          {/* Call teacher button */}
          <div className="px-3 pb-2 shrink-0">
            <button onClick={onOpenTicket}
              className="w-full py-2 rounded-xl border border-red-500/30 text-red-400/80 hover:bg-red-500/10 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
              <Ticket className="w-3.5 h-3.5" />
              {t('callTeacher')}
            </button>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 shrink-0">
            {mode === 'text' ? (
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendText()}
                  placeholder={t('typeMessage')}
                  className="input-field flex-1 text-sm py-2"
                  disabled={loading}
                />
                <button onClick={sendText} disabled={loading || !input.trim()}
                  className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-colors disabled:opacity-40">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={loading}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    recording
                      ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-110'
                      : 'bg-primary-600 hover:bg-primary-500 shadow-glow'
                  } disabled:opacity-40`}>
                  {recording ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                </button>
                <p className="text-white/40 text-xs">
                  {recording ? t('stopRecording') : t('startRecording')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function RobotAvatar({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      {/* Robot body glow */}
      <circle cx="50" cy="50" r="45" fill="rgba(59,130,246,0.1)" />
      {/* Head */}
      <rect x="25" y="15" width="50" height="42" rx="10" fill="#1e40af"/>
      <rect x="28" y="18" width="44" height="36" rx="8" fill="#2563eb"/>
      {/* Eyes */}
      <circle cx="38" cy="33" r="7" fill="#0f172a"/>
      <circle cx="62" cy="33" r="7" fill="#0f172a"/>
      <circle cx="38" cy="33" r="4" fill="#38bdf8"/>
      <circle cx="62" cy="33" r="4" fill="#38bdf8"/>
      <circle cx="39.5" cy="31.5" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="63.5" cy="31.5" r="1.5" fill="white" opacity="0.8"/>
      {/* Smile */}
      <path d="M40 44 Q50 50 60 44" stroke="#38bdf8" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Antenna */}
      <line x1="50" y1="15" x2="50" y2="5" stroke="#60a5fa" strokeWidth="2"/>
      <circle cx="50" cy="4" r="3" fill="#38bdf8"/>
      {/* Body */}
      <rect x="30" y="57" width="40" height="30" rx="8" fill="#1d4ed8"/>
      {/* Chest panel */}
      <rect x="38" y="63" width="24" height="14" rx="4" fill="#0f172a"/>
      <circle cx="44" cy="70" r="3" fill="#38bdf8" opacity="0.8"/>
      <circle cx="56" cy="70" r="3" fill="#34d399" opacity="0.8"/>
    </svg>
  );
}
