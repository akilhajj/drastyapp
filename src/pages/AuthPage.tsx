import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/lang';
import { Eye, EyeOff, GraduationCap, Globe, Upload, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { t, lang, setLang } = useLang();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'login') {
      /const { error } = await signIn(email, password);
   /if (error) setError(error);
    } else {
      const { error } = await signUp(email, password, fullName, phone);
      if (error) {
        setError(error);
      } else {
        setRegistered(true);
      }
    }
    setLoading(false);
  }

  async function uploadReceipt(userId: string) {
    if (!receiptFile) return null;
    setUploadingReceipt(true);
    const ext = receiptFile.name.split('.').pop();
    const path = `receipts/${userId}/receipt.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, receiptFile, { upsert: true });
    setUploadingReceipt(false);
    if (uploadError) return null;
    const { data } = supabase.storage.from('receipts').getPublicUrl(path);
    return data.publicUrl;
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-navy-950 bg-mesh flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center animate-slide-up">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('pendingApproval')}</h2>
          <p className="text-white/60">{t('pendingMessage')}</p>
          <button onClick={() => { setRegistered(false); setMode('login'); }}
            className="mt-6 premium-btn w-full">
            {t('login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-glow-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Lang toggle */}
      <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className="absolute top-4 right-4 flex items-center gap-2 glass rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white transition-colors">
        <Globe className="w-4 h-4" />
        {lang === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow animate-float">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">{t('appName')}</h1>
          <p className="text-white/40 text-sm mt-1">
            {mode === 'login' ? t('loginSubtitle') : t('registerSubtitle')}
          </p>
        </div>

        {/* 3D Student illustration */}
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32 animate-float-slow">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
              {/* Body */}
              <ellipse cx="100" cy="160" rx="45" ry="25" fill="#1e40af" opacity="0.4"/>
              {/* Torso */}
              <rect x="70" y="110" width="60" height="55" rx="10" fill="#2563eb"/>
              {/* Head */}
              <circle cx="100" cy="90" r="30" fill="#fbbf24"/>
              {/* Eyes */}
              <circle cx="91" cy="87" r="4" fill="#1e293b"/>
              <circle cx="109" cy="87" r="4" fill="#1e293b"/>
              <circle cx="92" cy="86" r="1.5" fill="white"/>
              <circle cx="110" cy="86" r="1.5" fill="white"/>
              {/* Smile */}
              <path d="M90 97 Q100 105 110 97" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round"/>
              {/* Book */}
              <rect x="50" y="100" width="28" height="35" rx="3" fill="#ef4444"/>
              <rect x="55" y="105" width="18" height="2" rx="1" fill="white" opacity="0.6"/>
              <rect x="55" y="110" width="14" height="2" rx="1" fill="white" opacity="0.4"/>
              <rect x="55" y="115" width="16" height="2" rx="1" fill="white" opacity="0.4"/>
              {/* Cap */}
              <ellipse cx="100" cy="63" rx="36" ry="7" fill="#1e293b"/>
              <rect x="88" y="45" width="24" height="18" fill="#1e293b"/>
              <rect x="130" y="65" width="8" height="8" rx="1" fill="#fbbf24"/>
              {/* Stars */}
              <circle cx="160" cy="30" r="3" fill="#fbbf24" opacity="0.8"/>
              <circle cx="40" cy="50" r="2" fill="#60a5fa" opacity="0.8"/>
              <circle cx="170" cy="80" r="2" fill="#a78bfa" opacity="0.6"/>
            </svg>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-1">
            {mode === 'login' ? t('loginTitle') : t('registerTitle')}
          </h2>
          <p className="text-white/40 text-sm mb-6">
            {mode === 'login' ? t('loginSubtitle') : t('registerSubtitle')}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-white/60 text-sm mb-1.5 block">{t('fullName')}</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    className="input-field" placeholder={t('fullName')} required />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1.5 block">{t('phone')}</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    className="input-field" placeholder={t('phone')} type="tel" />
                </div>
              </>
            )}

            <div>
              <label className="text-white/60 text-sm mb-1.5 block">{t('email')}</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder={t('email')} type="email" required />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-1.5 block">{t('password')}</label>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10" placeholder={t('password')}
                  type={showPass ? 'text' : 'password'} required minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 end-3 flex items-center text-white/40 hover:text-white/70">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-white/60 text-sm mb-1.5 block">{t('paymentReceipt')}</label>
                <label className="flex items-center gap-3 glass-card p-3 cursor-pointer hover:border-white/25 transition-colors">
                  <Upload className="w-5 h-5 text-primary-400" />
                  <span className="text-sm text-white/50">
                    {receiptFile ? receiptFile.name : t('uploadReceipt')}
                  </span>
                  <input type="file" className="hidden" accept="image/*,.pdf"
                    onChange={e => setReceiptFile(e.target.files?.[0] ?? null)} />
                </label>
                <p className="text-white/30 text-xs mt-1">{t('receiptNote')}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="premium-btn w-full mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                mode === 'login' ? t('login') : t('register')
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-white/40">
              {mode === 'login' ? t('noAccount') : t('hasAccount')}
            </span>{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              {mode === 'login' ? t('register') : t('login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
