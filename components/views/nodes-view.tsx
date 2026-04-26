'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Server, Activity, Globe, Zap, Shield, Network } from 'lucide-react';

interface VpnServer {
  id: number;
  name: string;
  ip_address: string;
  status: 'online' | 'offline' | 'maintenance';
  load_score: number;
  active_connections: number;
  supports_wireguard: boolean;
  supports_xray: boolean;
  location?: string;
}

export function NodesView() {
  const [servers, setServers] = useState<VpnServer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/servers')
      .then(res => res.json())
      .then(setServers)
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
            <Globe className="text-blue-500" />
            VPN Nodes
          </h2>
          <p className="text-sm text-slate-500">Global server network status and performance.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Nodes</p>
            <p className="text-xl font-bold text-slate-900">{servers.length}</p>
          </div>
          <div className="text-right border-l pl-4 border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Online</p>
            <p className="text-xl font-bold text-green-600">{servers.filter(s => s.status === 'online').length}</p>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-4 text-slate-400">
            <Activity className="animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Synchronizing nodes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <th className="px-6 py-4">Node Name</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Load Index</th>
                  <th className="px-6 py-4 text-center">Active</th>
                  <th className="px-6 py-4">Protocols</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {servers.map((server) => (
                  <tr key={server.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          server.status === 'online' ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Server size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{server.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{server.location || 'Global'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                      {server.ip_address}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        server.status === 'online' ? 'bg-green-100 text-green-700' :
                        server.status === 'offline' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {server.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              server.load_score < 40 ? 'bg-green-500' :
                              server.load_score < 80 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${server.load_score}%` }} 
                          />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{server.load_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-900">{server.active_connections}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Users</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        {server.supports_wireguard && (
                          <span className="p-1.5 bg-blue-50 text-blue-500 rounded-lg" title="WireGuard Supported">
                            <Shield size={14} />
                          </span>
                        )}
                        {server.supports_xray && (
                          <span className="p-1.5 bg-purple-50 text-purple-500 rounded-lg" title="X-Ray Supported">
                             <Network size={14} />
                          </span>
                        )}
                        <span className="p-1.5 bg-orange-50 text-orange-500 rounded-lg" title="OpenVPN Supported">
                          <Zap size={14} />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
