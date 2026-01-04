import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('CRITICAL: STRIPE_SECRET_KEY is missing from environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia' as any,
});

export const getBaseUrl = (headersList: Headers) => {
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const origin = headersList.get('origin');

    if (origin && !origin.includes('undefined')) return origin;
    return `${protocol}://${host}`;
};
