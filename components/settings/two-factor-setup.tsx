'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldOff, RefreshCw } from 'lucide-react';

export function TwoFactorSetup() {
  const [status, setStatus] = useState<'loading' | 'enabled' | 'setup' | 'disabling'>('loading');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setStatus('loading');
    setError('');
    const res = await fetch('/api/auth/2fa');
    const data = await res.json();
    if (data.enabled) {
      setStatus('enabled');
    } else {
      setQrDataUrl(data.qrDataUrl || '');
      setSecret(data.secret || '');
      setStatus('setup');
    }
  }

  useEffect(() => { load(); }, []);

  async function handleEnable(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setSuccess('احراز هویت دو مرحله‌ای فعال شد');
    setCode('');
    setStatus('enabled');
    setTimeout(() => setSuccess(''), 3000);
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/2fa', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: disableCode }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setSuccess('احراز هویت دو مرحله‌ای غیرفعال شد');
    setDisableCode('');
    await load();
    setTimeout(() => setSuccess(''), 3000);
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
        <Shield size={16} className="text-blue-600" />
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">
          احراز هویت دو مرحله‌ای (2FA)
        </h3>
        {status === 'enabled' && (
          <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            <ShieldCheck size={11} /> فعال
          </span>
        )}
      </div>

      <div className="p-6">
        {success && (
          <p className="mb-4 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            {success}
          </p>
        )}
        {error && (
          <p className="mb-4 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {status === 'loading' && (
          <p className="text-xs text-slate-400 animate-pulse">در حال بارگذاری...</p>
        )}

        {status === 'setup' && (
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              برنامه Google Authenticator یا Authy را باز کنید و QR کد زیر را اسکن کنید:
            </p>
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="2FA QR Code" className="w-44 h-44 rounded-lg border border-slate-200 p-2" />
                <p className="text-[11px] text-slate-400 font-mono bg-slate-50 px-3 py-1 rounded border border-slate-200 select-all">
                  {secret}
                </p>
              </div>
            )}
            <form onSubmit={handleEnable} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  کد ۶ رقمی از اپلیکیشن
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all whitespace-nowrap"
              >
                فعال‌سازی
              </button>
              <button
                type="button"
                onClick={load}
                className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg"
                title="بازسازی QR"
              >
                <RefreshCw size={16} />
              </button>
            </form>
          </div>
        )}

        {status === 'enabled' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              احراز هویت دو مرحله‌ای فعال است. برای غیرفعال‌سازی کد فعلی اپلیکیشن را وارد کنید:
            </p>
            <form onSubmit={handleDisable} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  کد ۶ رقمی
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-5 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-all"
              >
                <ShieldOff size={14} />
                غیرفعال‌سازی
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
