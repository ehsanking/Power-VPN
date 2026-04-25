'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Activity, Settings as SettingsIcon } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { UsersView } from '@/components/views/users-view';
import { AddUserModal } from '@/components/users/add-user-modal';
import { Toaster } from 'sonner';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUserAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-right" richColors />
      <ErrorBoundary>
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Shield size={14} />
              Secure Infrastructure
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">VPN Management Panel</h1>
            <p className="text-gray-500 text-lg">Centralized oversight for your VPN infrastructure and users.</p>
          </div>
          
          <AddUserModal onSuccess={handleUserAdded} />
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { icon: Users, label: 'Registered Users', value: '1,234', color: 'bg-blue-500', shadow: 'shadow-blue-100' },
            { icon: Activity, label: 'Active Sessions', value: '89', color: 'bg-emerald-500', shadow: 'shadow-emerald-100' },
            { icon: Shield, label: 'Security Protocols', value: 'AES-256', color: 'bg-indigo-500', shadow: 'shadow-indigo-100' },
            { icon: SettingsIcon, label: 'Server Uptime', value: '99.9%', color: 'bg-amber-500', shadow: 'shadow-amber-100' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white p-6 rounded-3xl border border-gray-100 hover:border-blue-200 transition-all shadow-sm ${item.shadow}`}
            >
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-current/20`}>
                <item.icon size={24} />
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{item.value}</p>
            </motion.div>
          ))}
        </div>

        <section className="mt-12">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
              <div className="text-sm font-medium text-gray-400">Showing latest accounts</div>
            </div>
            <div className="p-4 md:p-6">
              <UsersView key={refreshKey} />
            </div>
          </div>
        </section>
      </ErrorBoundary>
    </div>
  );
}
