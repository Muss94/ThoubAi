'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * Get current user's credit balance
 */
export async function getUserCredits() {
    const session = await auth();

    if (!session?.user?.email) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                measurementCredits: true,
                generationCredits: true,
            },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        return {
            success: true,
            measurementCredits: user.measurementCredits,
            generationCredits: user.generationCredits,
        };
    } catch (error) {
        console.error('Error fetching user credits:', error);
        return { success: false, error: 'Failed to fetch credits' };
    }
}

/**
 * Check if user has measurement credits available
 */
export async function checkMeasurementCredits() {
    const session = await auth();

    if (!session?.user?.email) {
        return { success: false, hasCredits: false, error: 'Not authenticated' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { measurementCredits: true },
        });

        if (!user) {
            return { success: false, hasCredits: false, error: 'User not found' };
        }

        return {
            success: true,
            hasCredits: user.measurementCredits > 0,
            credits: user.measurementCredits,
        };
    } catch (error) {
        console.error('Error checking measurement credits:', error);
        return { success: false, hasCredits: false, error: 'Failed to check credits' };
    }
}

/**
 * Check if user has generation credits available
 */
export async function checkGenerationCredits() {
    const session = await auth();

    if (!session?.user?.email) {
        return { success: false, hasCredits: false, error: 'Not authenticated' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { generationCredits: true },
        });

        if (!user) {
            return { success: false, hasCredits: false, error: 'User not found' };
        }

        return {
            success: true,
            hasCredits: user.generationCredits > 0,
            credits: user.generationCredits,
        };
    } catch (error) {
        console.error('Error checking generation credits:', error);
        return { success: false, hasCredits: false, error: 'Failed to check credits' };
    }
}

/**
 * Deduct one measurement credit from user
 */
export async function deductMeasurementCredit() {
    const session = await auth();

    if (!session?.user?.email) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { measurementCredits: true },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (user.measurementCredits <= 0) {
            return { success: false, error: 'No measurement credits available' };
        }

        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                measurementCredits: {
                    decrement: 1,
                },
            },
        });

        return {
            success: true,
            remainingCredits: user.measurementCredits - 1,
        };
    } catch (error) {
        console.error('Error deducting measurement credit:', error);
        return { success: false, error: 'Failed to deduct credit' };
    }
}

/**
 * Deduct one generation credit from user
 */
export async function deductGenerationCredit() {
    const session = await auth();

    if (!session?.user?.email) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { generationCredits: true },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (user.generationCredits <= 0) {
            return { success: false, error: 'No generation credits available' };
        }

        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                generationCredits: {
                    decrement: 1,
                },
            },
        });

        return {
            success: true,
            remainingCredits: user.generationCredits - 1,
        };
    } catch (error) {
        console.error('Error deducting generation credit:', error);
        return { success: false, error: 'Failed to deduct credit' };
    }
}

/**
 * Add credits to user account (after purchase)
 */
export async function addCredits(type: 'measurement' | 'generation', amount: number) {
    const session = await auth();

    if (!session?.user?.email) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const updateData = type === 'measurement'
            ? { measurementCredits: { increment: amount } }
            : { generationCredits: { increment: amount } };

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData,
            select: {
                measurementCredits: true,
                generationCredits: true,
            },
        });

        return {
            success: true,
            measurementCredits: user.measurementCredits,
            generationCredits: user.generationCredits,
        };
    } catch (error) {
        console.error('Error adding credits:', error);
        return { success: false, error: 'Failed to add credits' };
    }
}
