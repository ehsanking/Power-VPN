'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RotateCcw, 
  Shield, 
  Globe, 
  Lock, 
  Cpu, 
  FileText,
  AlertCircle,
  Database,
  CheckCircle2
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';

interface ServerConfig {
  publicIp: string;
  port: number;
  protocol: 'udp' | 'tcp';
  cipher: string;
  dnsServer: string;
}

export default function SettingsView() {
  const [config, setConfig] = useState<ServerConfig>({
    publicIp: '45.12.99.1',
    port: 1194,
    protocol: 'udp',
    cipher: 'AES-256-GCM',
    dnsServer: '1.1.1.1'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const docRef = doc(db, 'settings', 'config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data() as ServerConfig);
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'config'), config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving config", error);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center text-slate-300 text-xs font-bold uppercase tracking-widest">Parsing instance config...</div>;

  return (
    <div className="space-y-10 max-w-4xl pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Core Settings</h2>
        <p className="text-sm text-slate-500">Global configuration for the OpenVPN software stack.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Network Config */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
            <Globe size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Network Architecture</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <SettingField label="Public Node IP" description="The IP address visible to external clients.">
              <input 
                type="text" 
                value={config.publicIp}
                onChange={(e) => setConfig({...config, publicIp: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
            </SettingField>
            <SettingField label="Port" description="Standard: 1194">
              <input 
                type="number" 
                value={config.port}
                onChange={(e) => setConfig({...config, port: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
            </SettingField>
            <SettingField label="Protocol" description="UDP is optimized for low latency.">
              <select 
                value={config.protocol}
                onChange={(e) => setConfig({...config, protocol: e.target.value as 'udp' | 'tcp'})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
              >
                <option value="udp">UDP (Recommended)</option>
                <option value="tcp">TCP</option>
              </select>
            </SettingField>
            <SettingField label="Primary DNS" description="DNS resolver for connected tunnels.">
              <input 
                type="text" 
                value={config.dnsServer}
                onChange={(e) => setConfig({...config, dnsServer: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
            </SettingField>
          </div>
        </section>

        {/* Security Config */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
            <Lock size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Security Hardening</h3>
          </div>
          <div className="p-6">
            <SettingField label="Encryption Cipher">
              <select 
                value={config.cipher}
                onChange={(e) => setConfig({...config, cipher: e.target.value})}
                className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all mb-4"
              >
                <option value="AES-256-GCM">AES-256-GCM (Production Grade)</option>
                <option value="AES-128-GCM">AES-128-GCM (Lightweight)</option>
                <option value="CHACHA20-POLY1305">CHACHA20-POLY1305 (ARM Optimized)</option>
              </select>
            </SettingField>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <AlertCircle className="text-slate-400 shrink-0" size={18} />
              <p className="text-[11px] font-semibold text-slate-500 leading-tight">
                CRITICAL: Updating the encryption cipher will invalidate all previously exported client .ovpn files. Users will need to download updated profiles to reconnect.
              </p>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6">
          <button 
            type="button"
            className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            Reset to defaults
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-sm active:scale-95 disabled:bg-slate-300"
          >
            {saving ? 'Syncing...' : saved ? 'Changes Applied' : 'Commit Settings'}
          </button>
        </div>
      </form>

      {/* Advanced Maintenance */}
      <section className="pt-12 border-t border-slate-200">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          Critical Cluster
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MaintenanceButton 
            title="Reload Instance" 
            description="Restarts the OpenVPN daemon and re-initializes TUN/TAP interface."
            icon={<RotateCcw size={18} className="text-slate-400" />}
            onClick={() => alert("Simulating OpenVPN service restart...")}
          />
          <MaintenanceButton 
            title="Inspect Config" 
            description="Examine the generated server.conf file for compliance."
            icon={<FileText size={18} className="text-slate-400" />}
            onClick={() => alert("Displaying raw server.conf template...")}
          />
          <MaintenanceButton 
            title="Snapshot Sync" 
            description="Export all identity and session data to a portable format."
            icon={<Database size={18} className="text-slate-400" />}
            onClick={() => alert("Preparing DB snapshot...")}
          />
          <MaintenanceButton 
            title="Node Audit" 
            description="Perform a security audit on the current instance."
            icon={<Shield size={18} className="text-slate-400" />}
            onClick={() => alert("Initializing node security audit...")}
          />
        </div>
      </section>
    </div>
  );
}

function SettingField({ label, description, children }: { label: string, description?: string, children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
            {children}
            {description && <p className="text-[10px] font-medium text-slate-400">{description}</p>}
        </div>
    )
}

function MaintenanceButton({ title, description, icon, onClick }: { title: string, description: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left group active:scale-[0.98]"
    >
      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-[13px] font-bold text-slate-900 mb-1">{title}</h4>
        <p className="text-[11px] font-medium text-slate-400 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}
