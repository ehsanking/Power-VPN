'use client';

import React from 'react';

export function AdminToolsView() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Admin Tools</h2>
        <p className="text-sm text-slate-500">Manage system-wide configurations and tasks.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg text-slate-900">Backup & Restore</h3>
          <p className="text-sm text-slate-500 mt-2">Manage your data backups.</p>
          <button className="mt-4 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">Create Backup</button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg text-slate-900">SSL Management</h3>
          <p className="text-sm text-slate-500 mt-2">Manage SSL certificates.</p>
          <button className="mt-4 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">Renew Certificates</button>
        </div>
      </div>
    </div>
  );
}
