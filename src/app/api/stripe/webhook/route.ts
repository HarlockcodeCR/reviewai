import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(sub);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: sub.id },
      });
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'canceled', plan: 'free' },
        });
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        const subscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: invoice.subscription as string },
        });
        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'past_due' },
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionUpdate(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const priceId = sub.items.data[0]?.price.id;
  const currentPeriodEnd = new Date(sub.current_period_end * 1000);

  const status = sub.status === 'active' ? 'active'
    : sub.status === 'past_due' ? 'past_due'
    : sub.status === 'canceled' ? 'canceled'
    : 'inactive';

  await prisma.subscription.upsert({
    where: { stripeCustomerId: customerId },
    create: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      status,
      plan: 'pro',
      currentPeriodEnd,
      // We need userId — look up from customer metadata
      userId: await getUserIdFromCustomer(customerId),
    },
    update: {
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      status,
      plan: status === 'active' ? 'pro' : 'free',
      currentPeriodEnd,
    },
  });
}

async function getUserIdFromCustomer(customerId: string): Promise<string> {
  const existing = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    select: { userId: true },
  });
  if (existing) return existing.userId;

  const stripe_ = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const customer = await stripe_.customers.retrieve(customerId);
  if (customer.deleted) throw new Error('Customer deleted');
  const userId = (customer as Stripe.Customer).metadata.userId;
  if (!userId) throw new Error('No userId in customer metadata');
  return userId;
}
