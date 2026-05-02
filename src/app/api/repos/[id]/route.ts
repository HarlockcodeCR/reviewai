export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { makeOctokit, deleteWebhook } from '@/lib/github';

/** PATCH /api/repos/:id — update enabled flag or review rules */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const repo = await prisma.repo.findUnique({ where: { id: params.id } });
  if (!repo || repo.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  if (typeof body.enabled === 'boolean') updateData.enabled = body.enabled;
  if (body.rules && typeof body.rules === 'object') updateData.rules = body.rules;

  const updated = await prisma.repo.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json(updated);
}

/** DELETE /api/repos/:id — disconnect repo and remove webhook */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const repo = await prisma.repo.findUnique({ where: { id: params.id } });
  if (!repo || repo.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (repo.webhookId) {
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: 'github' },
      select: { access_token: true },
    });
    if (account?.access_token) {
      const [owner, repoName] = repo.fullName.split('/');
      const octokit = makeOctokit(account.access_token);
      await deleteWebhook(octokit, owner, repoName, repo.webhookId).catch(() => {});
    }
  }

  await prisma.repo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
