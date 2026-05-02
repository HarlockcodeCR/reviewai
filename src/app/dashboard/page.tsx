export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { DashboardClient } from './DashboardClient';
import { UpgradeButton, SignOutButton } from './DashboardActions';
import { FREE_PLAN_LIMIT, PRO_PLAN_LIMIT } from '@/types';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { upgraded?: string };
}) {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
      repos: {
        include: {
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              prNumber: true,
              prTitle: true,
              status: true,
              verdict: true,
              issueCount: true,
              criticalCount: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) redirect('/login');

  const isPro = user.subscription?.status === 'active' && user.subscription?.plan === 'pro';
  const limit = isPro ? PRO_PLAN_LIMIT : FREE_PLAN_LIMIT;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-white text-lg">
          ReviewAI
        </Link>
        <div className="flex items-center gap-4">
          {isPro ? (
            <span className="bg-white text-gray-900 text-xs font-bold px-2 py-1 rounded">PRO</span>
          ) : (
            <UpgradeButton />
          )}
          <span className="text-sm text-gray-400">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {searchParams.upgraded === '1' && (
          <div className="mb-6 bg-green-900 border border-green-700 text-green-200 rounded-xl px-5 py-4 text-sm">
            Welcome to Pro! You now have {PRO_PLAN_LIMIT} reviews per month.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <StatCard label="Reviews this month" value={`${user.reviewsThisMonth} / ${limit}`} />
          <StatCard label="Connected repos" value={user.repos.length} />
          <StatCard
            label="Plan"
            value={isPro ? 'Pro' : 'Free'}
            sub={
              isPro
                ? `Resets ${user.subscription?.currentPeriodEnd?.toLocaleDateString()}`
                : `${limit - user.reviewsThisMonth} remaining`
            }
          />
        </div>

        {/* Repos */}
        <DashboardClient repos={user.repos as Parameters<typeof DashboardClient>[0]['repos']} />
      </main>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}
