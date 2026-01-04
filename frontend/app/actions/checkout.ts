'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { stripe, getBaseUrl } from '@/lib/stripe';

export async function createCheckoutSession(data: {
    measurementId: string;
    config: {
        fabric: string;
        pattern: string;
        style: string;
        closure: string;
        pocket: boolean;
    };
    shippingDetails: {
        name: string;
        address: string;
        city: string;
        phone: string;
    };
}) {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        const headersList = await headers();
        const origin = getBaseUrl(headersList);

        // Verify measurement exists and belongs to user
        const measurement = await prisma.measurement.findUnique({
            where: { id: data.measurementId },
        });

        if (!measurement || measurement.userId !== session.user.id) {
            return { error: 'Invalid measurements' };
        }

        // Create the Stripe Checkout Session
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Bespoke Thoub - ${data.config.style}`,
                            description: `Custom tailored Thobe in ${data.config.fabric}.`,
                        },
                        unit_amount: 49900, // $499.00
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout?measurement_id=${measurement.id}&front_image_id=${measurement.frontImageId}&thobe_length=${measurement.thobeLength}&chest=${measurement.chest}&sleeve=${measurement.sleeve}&shoulder=${measurement.shoulder}&height_cm=${measurement.heightCm}`,
            customer_email: session.user.email!,
            metadata: {
                userId: session.user.id,
                measurementId: data.measurementId,
                config: JSON.stringify(data.config),
                shippingDetails: JSON.stringify(data.shippingDetails),
            },
        });

        // Create a pending order in our database
        await prisma.order.create({
            data: {
                userId: session.user.id,
                measurementId: data.measurementId,
                config: data.config,
                shippingDetails: data.shippingDetails,
                total: 49900,
                status: 'PENDING',
                stripeSessionId: stripeSession.id,
            },
        });

        return { url: stripeSession.url };
    } catch (error: any) {
        console.error('Stripe Session Error:', error);
        return { error: error.message || 'Payment initiation failed' };
    }
}
