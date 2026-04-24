'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: number;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  is_read: boolean;
  created_at: string;
}

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  info: <Info size={14} className="text-blue-500 shrink-0" />,
  warning: <AlertTriangle size={14} className="text-amber-500 shrink-0" />,
  critical: <AlertCircle size={14} className="text-red-500 shrink-0" />,
};

const SEVERITY_BG: Record<string, string> = {
  info: 'bg-blue-50 border-blue-100',
  warning: 'bg-amber-50 border-amber-100',
  critical: 'bg-red-50 border-red-100',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications?unread=false');
      if (res.ok) setNotifications(await res.json());
    } catch (_) {}
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markAll() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'all' }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markOne(id: number) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">اعلان‌ها</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAll}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <CheckCheck size={12} />
                  همه خوانده شد
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400 font-medium">
                  هیچ اعلانی وجود ندارد
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 text-xs ${
                      n.is_read ? 'bg-white' : SEVERITY_BG[n.severity] || 'bg-slate-50'
                    } border-l-2 ${
                      n.severity === 'critical'
                        ? 'border-red-400'
                        : n.severity === 'warning'
                        ? 'border-amber-400'
                        : 'border-blue-400'
                    }`}
                  >
                    <div className="pt-0.5">{SEVERITY_ICON[n.severity]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 font-medium leading-snug">{n.message}</p>
                      <p className="text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleString('fa-IR')}
                      </p>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={() => markOne(n.id)}
                        className="text-slate-300 hover:text-slate-600 shrink-0 pt-0.5"
                        title="خوانده شد"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
