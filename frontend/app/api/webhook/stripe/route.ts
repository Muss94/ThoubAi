import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const type = session.metadata?.type;

        if (userId) {
            try {
                if (type === 'credit_topup') {
                    // Handle Credit Top-up: +2 Measurement, +10 Generation
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            measurementCredits: { increment: 2 },
                            generationCredits: { increment: 10 },
                        },
                    });
                    console.log(`Credits incremented for user: ${userId}`);
                } else {
                    // Handle regular thobe order
                    await prisma.order.update({
                        where: { stripeSessionId: session.id },
                        data: { status: 'PAID' },
                    });
                    console.log(`Order updated to PAID for session ${session.id}`);
                }
            } catch (error) {
                console.error('Database Update Error during Webhook:', error);
                return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
