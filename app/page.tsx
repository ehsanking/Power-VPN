'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Activity, Settings as SettingsIcon } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <ErrorBoundary>
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">VPN Control Panel</h1>
          <p className="text-gray-600 text-lg">Manage your users and monitor server performance.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, label: 'Users', value: '1,234', color: 'bg-blue-500' },
            { icon: Activity, label: 'Sessions', value: '89', color: 'bg-green-500' },
            { icon: Shield, label: 'Security', value: 'Active', color: 'bg-purple-500' },
            { icon: SettingsIcon, label: 'System', value: 'Healthy', color: 'bg-orange-500' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                <item.icon size={24} />
              </div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{item.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{item.value}</p>
            </motion.div>
          ))}
        </div>

        <main className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <p className="text-gray-500 italic">No recent activity found.</p>
          </div>
        </main>
      </ErrorBoundary>
    </div>
  );
}
