'use client';

import React, { useState } from 'react';
import { Terminal, Globe, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Session {
  id: number;
  user_id: number;
  username: string;
  start_time: string;
  ip_address: string;
  status: 'active' | 'disconnected';
}

interface SessionItemProps {
  session: Session;
  now: number;
  onKill: (id: number) => void;
}

export function SessionItem({ session, now, onKill }: SessionItemProps) {
  const [isKilling, setIsKilling] = useState(false);

  const handleKill = async () => {
    if (confirm(`Kill session for ${session.username}?`)) {
      setIsKilling(true);
      await onKill(session.id);
      setIsKilling(false);
    }
  };

  return (
    <motion.div 
      layout
      key={session.id} 
      className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row gap-6 md:items-center group relative"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
          <Terminal size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">{session.username}</h4>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            <span className="flex items-center gap-1.5">
              <Globe size={10} />
              {session.ip_address}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 text-sm">
        <div className="text-left md:text-center min-w-[80px]">
          <p className="text-[9px] text-slate-400 mb-1 uppercase font-bold tracking-widest leading-none">Active For</p>
          <p className="text-xs font-bold text-slate-700 font-mono">
            {session.start_time ? 
              Math.floor((now - new Date(session.start_time).getTime()) / 60000) + 'm' : 
              '...'
            }
          </p>
        </div>
        <div className="text-left md:text-center min-w-[80px]">
          <p className="text-[9px] text-slate-400 mb-1 uppercase font-bold tracking-widest leading-none">Status</p>
          <p className="text-[10px] font-bold text-orange-500 uppercase">
            {session.status}
          </p>
        </div>
        
        <div className="text-right">
          <button 
            onClick={handleKill}
            disabled={isKilling || session.status === 'disconnected'}
            className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors bg-red-50 p-2 rounded-full"
            title="Kill Session"
          >
            <XCircle size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
