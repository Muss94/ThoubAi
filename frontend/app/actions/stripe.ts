'use server';

import Stripe from 'stripe';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24-preview' as any,
});

export async function createTopUpSession() {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    // Pack details: £2 for 2 Measurement Credits + 10 Generation Credits
    const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: 'Thoub AI Credit Pack',
                        description: '2 Measurement Credits + 10 Generation Credits',
                    },
                    unit_amount: 200, // £2.00
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/dashboard?status=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?status=cancelled`,
        metadata: {
            userId: session.user.id,
            type: 'credit_topup',
        },
    });

    if (!checkoutSession.url) {
        throw new Error('Failed to create checkout session');
    }

    redirect(checkoutSession.url);
}
