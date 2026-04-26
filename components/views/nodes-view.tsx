'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export function NodesView() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/servers')
      .then(res => res.json())
      .then(setServers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Nodes</h2>
        <p className="text-sm text-slate-500">Manage your nodes here.</p>
      </header>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {servers.map((server) => (
            <motion.div 
              key={server.id} 
              variants={{hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 }}}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <h3 className="font-semibold text-lg text-slate-900">{server.name}</h3>
              <p className="text-sm text-slate-500">{server.ip_address}</p>
              <div className="mt-4 flex gap-2">
                {server.supports_wireguard && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">WG</span>}
                {server.supports_xray && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">X-Ray</span>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
