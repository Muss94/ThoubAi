'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { stripe, getBaseUrl } from '@/lib/stripe';

export async function createCheckoutSession(data: {
    items: Array<{
        measurementId: string;
        config: {
            fabric: string;
            pattern: string;
            style: string;
            closure: string;
            pocket: boolean;
        };
        quantity: number;
        imageUrl?: string;
    }>;
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

    if (!data.items || data.items.length === 0) {
        return { error: 'No items in order' };
    }

    try {
        const headersList = await headers();
        const origin = getBaseUrl(headersList);

        // Verify all measurements exist and belong to user
        const measurementIds = data.items.map(item => item.measurementId);
        const measurements = await prisma.measurement.findMany({
            where: {
                id: { in: measurementIds },
                userId: session.user.id,
            },
        });

        if (measurements.length !== new Set(measurementIds).size) {
            return { error: 'Invalid measurements detected' };
        }

        // Map items to Stripe line items
        const line_items = data.items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `Bespoke Thoub - ${item.config.style}`,
                    description: `Tailored in ${item.config.fabric}. Pattern: ${item.config.pattern}.`,
                    images: item.imageUrl ? [item.imageUrl] : [],
                },
                unit_amount: 49900, // $499.00
            },
            quantity: item.quantity,
        }));

        // Calculate total
        const totalAmount = line_items.reduce((acc, item) => acc + (item.price_data.unit_amount * item.quantity), 0);

        // Create the Stripe Checkout Session
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout`,
            customer_email: session.user.email!,
            metadata: {
                userId: session.user.id,
                itemsCount: data.items.length.toString(),
                shippingDetails: JSON.stringify(data.shippingDetails),
            },
        });

        // Create a pending order in our database
        await prisma.order.create({
            data: {
                userId: session.user.id,
                shippingDetails: data.shippingDetails as any,
                total: totalAmount,
                status: 'PENDING',
                stripeSessionId: stripeSession.id,
                config: data.items as any, // Store the snapshot of items in JSON for quick reference
                items: {
                    create: data.items.map(item => ({
                        measurementId: item.measurementId,
                        config: item.config,
                        quantity: item.quantity,
                        unitAmount: 49900,
                    })),
                },
            },
        });

        return { url: stripeSession.url };
    } catch (error: any) {
        console.error('Stripe Session Error:', error);
        return { error: error.message || 'Payment initiation failed' };
    }
}

export async function getUserOrders() {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        const orders = await prisma.order.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                items: {
                    include: {
                        measurement: true,
                    },
                },
            } as any,
            orderBy: {
                createdAt: 'desc',
            },
        });

        return { orders };
    } catch (error) {
        console.error('Fetch Orders Error:', error);
        return { error: 'Failed to synchronize artisan ledger' };
    }
}

export async function getUserCatalogue() {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        const generations = await prisma.generation.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                measurement: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return { generations };
    } catch (error) {
        console.error('Fetch Catalogue Error:', error);
        return { error: 'Failed to synchronize artisan catalogue' };
    }
}
