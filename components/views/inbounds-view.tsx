'use client';

import React, { useState, useEffect } from 'react';
import { Network, Plus, Server, X, Edit2, Trash2, Shield, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Inbound {
  id: number;
  name: string;
  protocol: string;
  port: number;
  remark: string;
  created_at: string;
}

export default function InboundsView() {
  const [inbounds, setInbounds] = useState<Inbound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [name, setName] = useState('');
  const [protocol, setProtocol] = useState('vless');
  const [port, setPort] = useState('');
  const [remark, setRemark] = useState('');

  const fetchInbounds = async () => {
    try {
      const res = await fetch('/api/inbounds');
      const data = await res.json();
      if (data.inbounds) {
        setInbounds(data.inbounds);
      }
    } catch {
      toast.error('Failed to load inbounds');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInbounds();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !port) return toast.error('Name and port are required');
    
    try {
      const res = await fetch('/api/inbounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, protocol, port: parseInt(port), remark })
      });
      
      if (!res.ok) throw new Error('Failed to create inbound');
      
      toast.success('Inbound created successfully');
      setName('');
      setPort('');
      setRemark('');
      setIsAdding(false);
      fetchInbounds();
    } catch {
      toast.error('Failed to create inbound');
    }
  };

  const handleDelete = async (inbound: Inbound) => {
    if (!confirm(`Delete inbound ${inbound.name}?`)) return;
    try {
      const res = await fetch(`/api/inbounds/${inbound.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchInbounds();
        toast.success('Inbound deleted');
      } else {
        toast.error('Failed to delete inbound');
      }
    } catch {
      toast.error('Failed to delete inbound');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Network className="text-blue-500" />
            Inbound Assets
          </h2>
          <p className="text-sm text-gray-500">Protocol gates and inbound proxy entry points.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          {isAdding ? 'Cancel' : 'New Inbound'}
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Provision New Gateway</h3>
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Inbound Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="e.g. EU-VLESS-SECURE"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Protocol Stack</label>
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none"
                  >
                    <option value="vless">VLESS (XTLS-Reality)</option>
                    <option value="vmess">VMess (WebSocket)</option>
                    <option value="trojan">Trojan (gRPC)</option>
                    <option value="shadowsocks">Shadowsocks (AEAD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Listener Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="443"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stack Remark</label>
                  <input
                    type="text"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="Optional details"
                  />
                </div>
                <div className="lg:col-span-4 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg"
                  >
                    Initialize Protocol
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden min-h-[300px]">
        {isLoading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-4 text-slate-400">
            <Activity className="animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading configurations...</p>
          </div>
        ) : inbounds.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <Server size={32} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No protocol gates detected</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <th className="px-6 py-4">Gateway Name</th>
                  <th className="px-6 py-4">Protocol</th>
                  <th className="px-6 py-4">Port</th>
                  <th className="px-6 py-4">Remark</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <AnimatePresence mode="popLayout">
                  {inbounds.map((inbound) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={inbound.id} 
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                            <Shield size={16} />
                          </div>
                          <span className="font-bold text-slate-900 tracking-tight">{inbound.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600">
                          {inbound.protocol}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{inbound.port}</td>
                      <td className="px-6 py-4 text-slate-400 font-medium italic">{inbound.remark || 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Modify Gateway"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(inbound)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Destroy Gateway"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
        <span>Active Configuration Stack: {inbounds.length} Gates</span>
      </div>
    </motion.div>
  );
}
