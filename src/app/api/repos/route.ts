export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { makeOctokit, registerWebhook } from '@/lib/github';

async function getGithubToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { githubAccessToken: true },
  });
  return user?.githubAccessToken ?? null;
}

/** GET /api/repos — list user's connected repos with recent reviews */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const repos = await prisma.repo.findMany({
    where: { userId: session.user.id },
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
  });

  return NextResponse.json(repos);
}

/** POST /api/repos — connect a new repo and install webhook */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fullName } = await req.json();
  if (!fullName || typeof fullName !== 'string' || !fullName.includes('/')) {
    return NextResponse.json({ error: 'Invalid fullName' }, { status: 400 });
  }

  const [owner, repoName] = fullName.split('/');

  const token = await getGithubToken(session.user.id);
  if (!token) return NextResponse.json({ error: 'No GitHub token' }, { status: 401 });

  const octokit = makeOctokit(token);

  // Verify user has access to this repo
  let githubRepo: { id: number; full_name: string };
  try {
    const { data } = await octokit.repos.get({ owner, repo: repoName });
    githubRepo = data;
  } catch {
    return NextResponse.json({ error: 'Repo not found or no access' }, { status: 404 });
  }

  // Check if already connected
  const existing = await prisma.repo.findUnique({
    where: { userId_githubId: { userId: session.user.id, githubId: githubRepo.id } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Repo already connected' }, { status: 409 });
  }

  // Register webhook
  let webhookId: number | undefined;
  try {
    webhookId = await registerWebhook(octokit, owner, repoName);
  } catch (err) {
    console.error('Webhook registration failed:', err);
    // Continue without webhook — user can retry
  }

  const repo = await prisma.repo.create({
    data: {
      userId: session.user.id,
      githubId: githubRepo.id,
      fullName: githubRepo.full_name,
      webhookId,
      enabled: true,
    },
  });

  return NextResponse.json(repo, { status: 201 });
}
