'use client';

import { useState } from 'react';

export function ConnectRepo({ onConnected }: { onConnected: (repo: unknown) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to connect repo');
        return;
      }
      onConnected(data);
      setValue('');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-dashed border-gray-700 rounded-xl p-6 w-full text-gray-400 hover:border-gray-500 hover:text-gray-300 transition"
      >
        <span className="text-2xl">+</span>
        <span className="font-medium">Connect a repository</span>
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">Connect a repository</h3>
      <div className="flex gap-3">
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="owner/repository"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-500"
          required
          pattern="[^/]+/[^/]+"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-gray-900 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50"
        >
          {loading ? 'Connecting…' : 'Connect'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2.5 text-gray-400 hover:text-white transition text-sm"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
      <p className="mt-3 text-xs text-gray-500">
        Enter the full name, e.g. <code className="bg-gray-800 px-1 py-0.5 rounded">acme/my-app</code>.
        You must have admin access to the repo.
      </p>
    </form>
  );
}
