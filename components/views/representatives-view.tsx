'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shield, Star, Activity, MoreHorizontal, UserCheck } from 'lucide-react';

interface Representative {
  id: number;
  username: string;
  status: 'active' | 'suspended' | 'disabled';
  created_at: string;
  traffic_total?: number;
}

export function RepresentativesView() {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        const reps = (data.data || []).filter((u: any) => u.role === 'reseller');
        setRepresentatives(reps);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCheck className="text-purple-500" />
            V-Stack Representatives
          </h2>
          <p className="text-sm text-slate-500">Authorized resellers and distribution partners.</p>
        </div>
        <div className="bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 italic">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Active Fleet</p>
          <p className="text-xl font-black text-purple-700">{representatives.length}</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-4 text-slate-400">
            <Activity className="animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading partner network...</p>
          </div>
        ) : representatives.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <Users size={32} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No representatives registered</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <th className="px-6 py-4">Partner Identity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Accreditation</th>
                  <th className="px-6 py-4">Onboarded</th>
                  <th className="px-6 py-4 text-right">Registry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                <AnimatePresence mode="popLayout">
                  {representatives.map((rep) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={rep.id} 
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                            <Shield size={16} />
                          </div>
                          <span className="font-bold text-slate-900 tracking-tight">{rep.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                          rep.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {rep.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-orange-400">
                          <Star size={12} fill="currentColor" />
                          <Star size={12} fill="currentColor" />
                          <Star size={12} fill="currentColor" />
                          <span className="ml-1 text-[10px] font-bold text-slate-400 uppercase">Tier 1</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
                        {new Date(rep.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
