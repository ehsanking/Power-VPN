'use client';

import React, { useState, useEffect } from 'react';
import { SystemMetrics } from '../dashboard/system-metrics';

import { HardDrive, Signal, AlertTriangle } from 'lucide-react';

const generateChartData = (length: number, max: number) => 
  Array.from({ length }).map(() => ({ value: Math.floor(Math.random() * max) }));

export default function SystemStatusView() {
  const [cpuData, setCpuData] = useState(generateChartData(15, 100));
  const [ramData, setRamData] = useState(generateChartData(15, 100));

  useEffect(() => {
    const chartInterval = setInterval(() => {
      setCpuData(prev => [...prev.slice(1), { value: Math.floor(Math.random() * Math.random() * 100) }]);
      setRamData(prev => [...prev.slice(1), { value: Math.floor(Math.random() * 50 + 20) }]);
    }, 2000);
    return () => clearInterval(chartInterval);
  }, []);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">System Health</h2>
        <p className="text-sm text-slate-500">Real-time monitoring of server resources and core health metrics.</p>
      </header>

      <SystemMetrics cpuData={cpuData} ramData={ramData} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Signal size={20} />
             </div>
             <h3 className="font-bold text-slate-900">Uptime</h3>
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tight">99.99<span className="text-lg text-slate-400 font-medium">%</span></p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">High Availability</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <HardDrive size={20} />
             </div>
             <h3 className="font-bold text-slate-900">Disk Status</h3>
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tight">Optimal</p>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">I/O Performance normalized</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <AlertTriangle size={20} />
             </div>
             <h3 className="font-bold text-slate-900">Health Alerts</h3>
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tight">0</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">No critical issues</p>
        </div>
      </div>
    </div>
  );
}
