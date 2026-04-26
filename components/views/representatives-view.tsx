'use client';

import React, { useState, useEffect } from 'react';

export function RepresentativesView() {
  const [representatives, setRepresentatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        const reps = data.data.filter((u: any) => u.role === 'reseller');
        setRepresentatives(reps);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Representatives</h2>
        <p className="text-sm text-slate-500">Manage your representatives here.</p>
      </header>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <ul role="list" className="divide-y divide-gray-200">
            {representatives.map((rep) => (
              <li key={rep.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{rep.username}</p>
                  <p className="text-sm text-slate-500">{rep.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
