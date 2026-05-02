export const dynamic = 'force-dynamic';

import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runReview } from '@/lib/github';
import { FREE_PLAN_LIMIT, PRO_PLAN_LIMIT } from '@/types';

/** Verify GitHub's HMAC-SHA256 signature */
function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return false;

  const digest = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('x-hub-signature-256');
  const event = req.headers.get('x-github-event');

  if (!verifySignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Only handle pull_request events
  if (event !== 'pull_request') {
    return NextResponse.json({ skipped: true, reason: 'not a pull_request event' });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const action = body.action as string;

  // Only review when a PR is opened, reopened, or new commits are pushed
  if (!['opened', 'synchronize', 'reopened'].includes(action)) {
    return NextResponse.json({ skipped: true, reason: `action=${action} not reviewed` });
  }

  const prData = body.pull_request as {
    number: number;
    title: string;
    html_url: string;
    head: { sha: string };
  };
  const repoData = body.repository as { id: number; full_name: string };

  // Find the repo record (proves the webhook belongs to a connected repo)
  const repo = await prisma.repo.findFirst({
    where: { githubId: repoData.id, enabled: true },
    include: {
      user: {
        select: {
          id: true,
          githubAccessToken: true,
          reviewsThisMonth: true,
          reviewsResetAt: true,
          subscription: true,
        },
      },
    },
  });

  if (!repo) {
    return NextResponse.json({ skipped: true, reason: 'repo not connected or disabled' });
  }

  // Check usage limits
  const user = repo.user;
  const now = new Date();
  const resetAt = user.reviewsResetAt;
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

  let reviewsUsed = user.reviewsThisMonth;
  if (resetAt < monthAgo) {
    // New month — reset counter
    await prisma.user.update({
      where: { id: user.id },
      data: { reviewsThisMonth: 0, reviewsResetAt: now },
    });
    reviewsUsed = 0;
  }

  const isPro = user.subscription?.status === 'active' && user.subscription?.plan === 'pro';
  const limit = isPro ? PRO_PLAN_LIMIT : FREE_PLAN_LIMIT;

  if (reviewsUsed >= limit) {
    return NextResponse.json({ skipped: true, reason: 'monthly review limit reached' });
  }

  // Create review record
  const review = await prisma.review.create({
    data: {
      repoId: repo.id,
      prNumber: prData.number,
      prTitle: prData.title,
      prUrl: prData.html_url,
      headSha: prData.head.sha,
      status: 'pending',
    },
  });

  // Run the review asynchronously — respond to GitHub immediately (< 10s requirement)
  // In production, offload to a queue (BullMQ, Inngest, etc.). Here we fire-and-forget.
  runReview({ ...review, repo: { ...repo, user } }).catch(async (err) => {
    console.error(`Review ${review.id} failed:`, err);
    await prisma.review.update({
      where: { id: review.id },
      data: {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
  });

  return NextResponse.json({ ok: true, reviewId: review.id });
}
