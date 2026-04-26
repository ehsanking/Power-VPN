'use client';

import React, { useState, useEffect } from 'react';
import { SystemMetrics } from '../dashboard/system-metrics';

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

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Server Health Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-medium">Uptime: 99.99%</div>
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-medium">Internal Core: Running</div>
        </div>
      </div>
    </div>
  );
}
