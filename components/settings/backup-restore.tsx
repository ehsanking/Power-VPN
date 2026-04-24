import React, { useState } from 'react';
import { Database, Download, Upload, AlertCircle } from 'lucide-react';

export function BackupRestore() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleBackup = async () => {
        setLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/backup/export');
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vpn-backup-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setMessage('Backup successful.');
            } else {
                setMessage('Backup failed.');
            }
        } catch (e) {
            setMessage('Backup failed.');
        }
        setLoading(false);
    };

    const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm('Warning: This will overwrite current data. Proceed?')) return;

        setLoading(true);
        setMessage('Uploading...');
        
        try {
            const text = await file.text();
            // Basic validation
            JSON.parse(text);

            const res = await fetch('/api/backup/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: text
            });

            if (res.ok) {
                setMessage('Restore completed successfully.');
                // Hard refresh to reload state
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setMessage('Restore failed on server.');
            }
        } catch (e) {
            setMessage('Invalid backup file.');
        }
        setLoading(false);
    };

    return (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-10">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                    <Database size={16} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Smart Migration & Backups</h3>
                </div>
            </div>
            <div className="p-6">
                <p className="text-sm text-slate-500 mb-6">
                    Export your database to safely migrate to PostgreSQL or another server, or restore from a previously exported backup. Includes all users, reseller limits, and configurations.
                </p>

                {message && (
                    <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-xs font-bold rounded flex items-center gap-2">
                        <AlertCircle size={14} />
                        {message}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleBackup}
                        disabled={loading}
                        className="flex-1 bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Download size={18} />
                        Export Backup (JSON)
                    </button>

                    <label className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                        <Upload size={18} />
                        Restore Migration Payload
                        <input 
                            type="file" 
                            accept=".json" 
                            className="hidden" 
                            onChange={handleRestore}
                            disabled={loading}
                        />
                    </label>
                </div>
            </div>
        </section>
    );
}
