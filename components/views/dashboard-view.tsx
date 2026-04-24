'use client';

import React from 'react';
import { 
  Users, 
  Activity, 
  ShieldCheck, 
  Clock,
  TrendingDown,
  TrendingUp,
  Globe
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';

const data = [
  { name: '00:00', traffic: 400, connections: 24 },
  { name: '04:00', traffic: 300, connections: 18 },
  { name: '08:00', traffic: 900, connections: 45 },
  { name: '12:00', traffic: 1200, connections: 62 },
  { name: '16:00', traffic: 1500, connections: 78 },
  { name: '20:00', traffic: 1100, connections: 55 },
];

export default function DashboardView() {
  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Network Overview</h2>
          <p className="text-sm text-slate-500">Manage your OpenVPN nodes and active users.</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                <Globe size={16} />
                <span>Node Status</span>
            </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Users" 
          value="124" 
          change="+12% from yesterday" 
          trend="up"
        />
        <StatCard 
          title="Current Bandwidth" 
          value="1.2 Gbps" 
          change="Peaks at 2.4 Gbps" 
          trend="up"
        />
        <StatCard 
          title="CPU Load" 
          value="14%" 
          change="System Stable" 
          trend="up"
          showProgress
          progressValue={14}
        />
        <StatCard 
          title="Uptime" 
          value="142d" 
          change="Since last kernel update" 
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 tracking-tight">Traffic Throughput</h3>
            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
              <button className="px-3 py-1 bg-white text-xs font-bold text-blue-600 rounded shadow-sm border border-slate-200">24h</button>
              <button className="px-3 py-1 text-xs font-semibold text-slate-400 hover:text-slate-600">7d</button>
              <button className="px-3 py-1 text-xs font-semibold text-slate-400 hover:text-slate-600">30d</button>
            </div>
          </div>
          <div className="h-[320px] w-full pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} 
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="traffic" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorTraffic)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 tracking-tight">System Resources</h3>
          </div>
          <div className="p-6 space-y-8 flex-1">
            <StatusItem label="CPU Load" value="14%" percentage={14} color="bg-blue-600" />
            <StatusItem label="Memory" value="3.2 / 16 GB" percentage={20} color="bg-indigo-600" />
            <StatusItem label="Disk Usage" value="45 GB Free" percentage={65} color="bg-slate-800" />
            <StatusItem label="Active Tunnels" value="85%" percentage={85} color="bg-green-600" />
          </div>
          <div className="p-6 pt-0">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Link</span>
                <span className="text-xs font-bold text-green-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Verified
                </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, showProgress, progressValue }: { title: string, value: string, change: string, trend: 'up' | 'down', showProgress?: boolean, progressValue?: number }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all group">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mb-1">{title}</p>
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        {showProgress && progressValue !== undefined && (
             <div className="flex-1 max-w-[40px] h-1 bg-slate-100 rounded-full overflow-hidden self-center ml-2">
                <div className="h-full bg-blue-500" style={{ width: `${progressValue}%` }} />
             </div>
        )}
      </div>
      <p className={`text-[11px] font-semibold ${
        trend === 'up' ? 'text-green-600' : 'text-slate-400'
      }`}>
        {change}
      </p>
    </div>
  );
}

function StatusItem({ label, value, percentage, color }: { label: string, value: string, percentage: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="font-bold text-slate-900 uppercase tracking-widest" style={{fontSize: '9px'}}>{label}</span>
        <span className="font-bold text-slate-600">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
