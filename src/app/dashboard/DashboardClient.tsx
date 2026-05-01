'use client';

import { useState } from 'react';
import { RepoCard } from '@/components/RepoCard';
import { ConnectRepo } from '@/components/ConnectRepo';
import type { Repo, Review } from '@prisma/client';

type RepoWithReviews = Repo & {
  reviews: Pick<Review, 'id' | 'prNumber' | 'prTitle' | 'status' | 'verdict' | 'issueCount' | 'criticalCount' | 'createdAt'>[];
};

export function DashboardClient({ repos: initial }: { repos: RepoWithReviews[] }) {
  const [repos, setRepos] = useState(initial);

  function handleConnected(newRepo: unknown) {
    setRepos((prev) => [{ ...(newRepo as RepoWithReviews), reviews: [] }, ...prev]);
  }

  function handleDelete(id: string) {
    setRepos((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">Connected repositories</h2>
      <div className="space-y-4">
        <ConnectRepo onConnected={handleConnected} />
        {repos.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            No repos connected yet. Add one above to start getting reviews.
          </p>
        )}
        {repos.map((repo) => (
          <RepoCard key={repo.id} repo={repo} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
