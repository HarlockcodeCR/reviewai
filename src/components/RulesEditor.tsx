'use client';

import { useState } from 'react';
import type { RepoRules, ReviewCategory, ReviewSeverity } from '@/types';

const ALL_CATEGORIES: ReviewCategory[] = ['security', 'performance', 'style', 'architecture', 'bug'];
const SEVERITIES: ReviewSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

export function RulesEditor({ repoId, initial }: { repoId: string; initial: RepoRules }) {
  const [rules, setRules] = useState<RepoRules>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleCategory(cat: ReviewCategory) {
    setRules((r) => ({
      ...r,
      categories: r.categories.includes(cat)
        ? r.categories.filter((c) => c !== cat)
        : [...r.categories, cat],
    }));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/repos/${repoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">Review categories</p>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
                rules.categories.includes(cat)
                  ? 'bg-white text-gray-900 font-semibold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">Minimum severity</p>
        <select
          value={rules.minSeverity}
          onChange={(e) => setRules((r) => ({ ...r, minSeverity: e.target.value as ReviewSeverity }))}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
        >
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setRules((r) => ({ ...r, autoApprove: !r.autoApprove }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            rules.autoApprove ? 'bg-green-600' : 'bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              rules.autoApprove ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <div>
          <p className="text-sm text-white">Auto-approve clean PRs</p>
          <p className="text-xs text-gray-500">Approve automatically when no issues are found</p>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bg-white text-gray-900 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save rules'}
      </button>
    </div>
  );
}
