'use server';

import { auth } from '@/auth';
import { headers } from 'next/headers';
import { stripe, getBaseUrl } from '@/lib/stripe';

export async function createTopUpSession() {
    try {
        console.log('Initiating top-up session...');
        const headersList = await headers();
        const origin = getBaseUrl(headersList);

        console.log('User auth session check...');
        const session = await auth();

        if (!session?.user?.id) {
            console.log('Auth failed: No user ID found');
            return { error: 'Unauthorized: Please log in again' };
        }

        console.log('Creating Stripe session for user:', session.user.id);
        console.log('Using origin for callbacks:', origin);

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
            success_url: `${origin}/dashboard?status=success`,
            cancel_url: `${origin}/dashboard?status=cancelled`,
            metadata: {
                userId: session.user.id,
                type: 'credit_topup',
            },
        });

        if (!checkoutSession.url) {
            return { error: 'Failed to create checkout session' };
        }

        return { url: checkoutSession.url };
    } catch (error: any) {
        console.error('Top-up Session Error:', error);
        return { error: error.message || 'Payment initiation failed' };
    }
}
