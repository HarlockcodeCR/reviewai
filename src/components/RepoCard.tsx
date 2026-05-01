'use client';

import { useState } from 'react';
import type { Repo, Review } from '@prisma/client';

type RepoWithReviews = Repo & { reviews: Pick<Review, 'id' | 'prNumber' | 'prTitle' | 'status' | 'verdict' | 'issueCount' | 'criticalCount' | 'createdAt'>[] };

export function RepoCard({ repo, onDelete }: { repo: RepoWithReviews; onDelete: (id: string) => void }) {
  const [enabled, setEnabled] = useState(repo.enabled);
  const [loading, setLoading] = useState(false);

  async function toggleEnabled() {
    setLoading(true);
    try {
      const res = await fetch(`/api/repos/${repo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (res.ok) setEnabled(!enabled);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Disconnect ${repo.fullName}? The webhook will be removed.`)) return;
    setLoading(true);
    const res = await fetch(`/api/repos/${repo.id}`, { method: 'DELETE' });
    if (res.ok) onDelete(repo.id);
    setLoading(false);
  }

  const latestReview = repo.reviews[0];
  const totalReviews = repo.reviews.length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <a
            href={`https://github.com/${repo.fullName}`}
            target="_blank"
            rel="noreferrer"
            className="text-white font-semibold hover:underline"
          >
            {repo.fullName}
          </a>
          <p className="text-sm text-gray-500 mt-1">
            {repo.webhookId ? 'Webhook active' : 'No webhook'} &middot;{' '}
            {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleEnabled}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-green-600' : 'bg-gray-700'
            } disabled:opacity-50`}
            title={enabled ? 'Disable reviews' : 'Enable reviews'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-gray-500 hover:text-red-400 transition text-sm disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      {latestReview && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Latest review</p>
          <div className="flex items-center gap-3">
            <StatusBadge status={latestReview.status} verdict={latestReview.verdict} />
            <span className="text-sm text-gray-300 truncate">
              PR #{latestReview.prNumber}
              {latestReview.prTitle ? ` — ${latestReview.prTitle}` : ''}
            </span>
          </div>
          {latestReview.issueCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {latestReview.issueCount} issue{latestReview.issueCount !== 1 ? 's' : ''}
              {latestReview.criticalCount > 0 && (
                <span className="text-red-400"> ({latestReview.criticalCount} critical)</span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, verdict }: { status: string; verdict: string | null }) {
  if (status === 'completed') {
    const colors = {
      approve: 'bg-green-900 text-green-300',
      request_changes: 'bg-red-900 text-red-300',
      comment: 'bg-blue-900 text-blue-300',
    };
    const labels = { approve: 'Approved', request_changes: 'Changes Requested', comment: 'Commented' };
    const color = colors[verdict as keyof typeof colors] ?? 'bg-gray-800 text-gray-400';
    const label = labels[verdict as keyof typeof labels] ?? verdict ?? 'Done';
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>;
  }
  if (status === 'pending') return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-900 text-yellow-300">Pending</span>;
  if (status === 'failed') return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-400">Failed</span>;
  if (status === 'skipped') return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400">Skipped</span>;
  return null;
}
