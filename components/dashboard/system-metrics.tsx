'use client';

import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';

export function SystemMetrics({ cpuData, ramData }: { cpuData: any[]; ramData: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-48">
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cpuData}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-between items-end">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">CPU</span>
          <span className="text-xl font-bold text-slate-800">{cpuData[cpuData.length - 1]?.value || 0}%</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-48">
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ramData}>
              <defs>
                <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRam)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-between items-end">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">RAM</span>
          <span className="text-xl font-bold text-slate-800">{ramData[ramData.length - 1]?.value || 0}%</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center h-48">
        <div className="flex w-full items-center justify-around h-full">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-red-50 text-red-500 rounded-full mb-3">
              <ArrowUp size={28} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold text-slate-800 mb-1">{(Math.random() * 50 + 10).toFixed(1)} <span className="text-base text-slate-400 font-medium">MB/s</span></span>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Upload</span>
          </div>
          <div className="w-px h-24 bg-slate-100"></div>
          <div className="flex flex-col items-center">
            <div className="p-3 bg-green-50 text-green-500 rounded-full mb-3">
              <ArrowDown size={28} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold text-slate-800 mb-1">{(Math.random() * 150 + 50).toFixed(1)} <span className="text-base text-slate-400 font-medium">MB/s</span></span>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Download</span>
          </div>
        </div>
      </div>
    </div>
  );
}
