export const dynamic = 'force-dynamic';

import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;
  const digest = createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('x-signature');

  if (!verifySignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = body.meta && (body.meta as Record<string, unknown>).event_name as string;
  const data = body.data as Record<string, unknown> | undefined;
  const attributes = data?.attributes as Record<string, unknown> | undefined;

  if (!eventName || !attributes) {
    return NextResponse.json({ skipped: true });
  }

  if (
    eventName === 'subscription_created' ||
    eventName === 'subscription_updated'
  ) {
    const status = attributes.status as string;
    const userEmail = (attributes.user_email as string | undefined)?.toLowerCase();
    const lsSubscriptionId = String(data!.id);
    const lsCustomerId = String(attributes.customer_id);
    const lsVariantId = attributes.variant_id ? String(attributes.variant_id) : null;
    const renewsAt = attributes.renews_at as string | null;

    if (!userEmail) {
      return NextResponse.json({ error: 'Missing user_email' }, { status: 422 });
    }

    const user = await prisma.user.findFirst({
      where: { email: userEmail },
    });

    if (!user) {
      console.error(`LemonSqueezy webhook: no user found for email ${userEmail}`);
      // Return 200 so LemonSqueezy doesn't retry indefinitely
      return NextResponse.json({ skipped: true, reason: 'user not found' });
    }

    const isPro = status === 'active';

    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        lsSubscriptionId,
        lsCustomerId,
        lsVariantId,
        status,
        plan: isPro ? 'pro' : 'free',
        currentPeriodEnd: renewsAt ? new Date(renewsAt) : null,
      },
      update: {
        lsSubscriptionId,
        lsCustomerId,
        lsVariantId,
        status,
        plan: isPro ? 'pro' : 'free',
        currentPeriodEnd: renewsAt ? new Date(renewsAt) : null,
      },
    });

    return NextResponse.json({ ok: true });
  }

  if (eventName === 'subscription_cancelled') {
    const lsSubscriptionId = String(data!.id);

    await prisma.subscription.updateMany({
      where: { lsSubscriptionId },
      data: { status: 'cancelled', plan: 'free' },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ skipped: true, reason: `unhandled event: ${eventName}` });
}
