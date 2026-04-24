'use client';

import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw } from 'lucide-react';

interface AuditEntry {
  id: number;
  action: string;
  details: string;
  context: any;
  created_at: string;
}

const ACTION_COLOR: Record<string, string> = {
  'user.create': 'text-green-700 bg-green-50 border-green-200',
  'user.delete': 'text-red-700 bg-red-50 border-red-200',
  'user.status_change': 'text-amber-700 bg-amber-50 border-amber-200',
  'server.create': 'text-blue-700 bg-blue-50 border-blue-200',
  'server.delete': 'text-red-700 bg-red-50 border-red-200',
  'settings.update': 'text-purple-700 bg-purple-50 border-purple-200',
  'auth.login': 'text-slate-700 bg-slate-50 border-slate-200',
  'auth.logout': 'text-slate-700 bg-slate-50 border-slate-200',
  'auth.login_failed': 'text-red-700 bg-red-50 border-red-200',
  '2fa.enabled': 'text-green-700 bg-green-50 border-green-200',
  '2fa.disabled': 'text-amber-700 bg-amber-50 border-amber-200',
};

export function AuditLogView() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  async function fetchLogs() {
    setLoading(true);
    try {
      const url = actionFilter
        ? `/api/audit?action=${encodeURIComponent(actionFilter)}&limit=100`
        : '/api/audit?limit=100';
      const res = await fetch(url);
      if (res.ok) setLogs(await res.json());
    } catch (_) {}
    setLoading(false);
  }

  useEffect(() => { fetchLogs(); }, [actionFilter]);

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">لاگ عملیات ادمین</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">همه عملیات</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            onClick={fetchLogs}
            className="p-1.5 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <p className="p-6 text-xs text-slate-400 animate-pulse text-center">در حال بارگذاری...</p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-xs text-slate-400 text-center">هیچ لاگی ثبت نشده است</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">زمان</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">عملیات</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-slate-400 font-mono whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('fa-IR')}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        ACTION_COLOR[log.action] || 'text-slate-700 bg-slate-50 border-slate-200'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
