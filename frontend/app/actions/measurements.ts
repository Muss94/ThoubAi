'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function saveUserMeasurements(data: {
    userId: string;
    userEmail: string;
    heightCm: number;
    frontImageId: string;
    sideImageId?: string;
    profileImageId?: string;
    measurements: {
        thobeLength: number;
        chest: number;
        sleeve: number;
        shoulder: number;
    };
}) {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Ensure user exists and has enough measurement credits
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return { success: false, error: "User profile not found. Please sign in again." };
        }

        if (user.measurementCredits <= 0) {
            return { success: false, error: "INSUFFICIENT_CREDITS", type: "measurement" };
        }

        const measurement = await prisma.measurement.create({
            data: {
                userId: user.id,
                thobeLength: data.measurements.thobeLength,
                chest: data.measurements.chest,
                sleeve: data.measurements.sleeve,
                shoulder: data.measurements.shoulder,
                heightCm: data.heightCm,
                frontImageId: data.frontImageId,
                sideImageId: data.sideImageId,
                profileImageId: data.profileImageId,
            },
        });

        // Decrement credit
        await prisma.user.update({
            where: { id: user.id },
            data: { measurementCredits: { decrement: 1 } }
        });

        return { success: true, measurementId: measurement.id };
    } catch (error) {
        console.error("Prisma Save Error:", error);
        return { success: false, error: "Database synchronization failed" };
    }
}

export async function saveGeneration(data: {
    measurementId: string;
    imageUrl: string;
    config: {
        fabric: string;
        pattern: string;
        style: string;
        closure: string;
        pocket: boolean;
    };
}) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Fetch user to check credits
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) return { success: false, error: "User not found" };

        // New Configuration: Check credits
        if (user.generationCredits <= 0) {
            return { success: false, error: "INSUFFICIENT_CREDITS", type: "generation" };
        }

        // Create new entry
        const generation = await prisma.generation.create({
            data: {
                userId: session.user.id,
                measurementId: data.measurementId,
                imageUrl: data.imageUrl,
                config: data.config,
            },
        });

        // Decrement generation credit
        await prisma.user.update({
            where: { id: user.id },
            data: { generationCredits: { decrement: 1 } }
        });

        return { success: true, generationId: generation.id };
    } catch (error) {
        console.error("Prisma Generation Save Error:", error);
        return { success: false, error: "Failed to save to catalogue" };
    }
}

export async function getGenerationData(generationId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const generation = await prisma.generation.findUnique({
            where: { id: generationId },
            include: {
                measurement: true
            }
        });

        if (!generation || generation.userId !== session.user.id) {
            return { success: false, error: "Generation not found" };
        }

        return { success: true, generation };
    } catch (error) {
        console.error("Prisma Fetch Error:", error);
        return { success: false, error: "Failed to retrieve generation" };
    }
}

export async function updateMeasurementProfileImage(measurementId: string, profileImageId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const measurement = await prisma.measurement.findUnique({
            where: { id: measurementId },
        });

        if (!measurement || measurement.userId !== session.user.id) {
            return { success: false, error: "Measurement not found" };
        }

        await prisma.measurement.update({
            where: { id: measurementId },
            data: { profileImageId },
        });

        return { success: true };
    } catch (error) {
        console.error("Prisma Update Error:", error);
        return { success: false, error: "Failed to update profile image" };
    }
}

export async function updateUserProfileImage(filename: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: filename }, // Sync to account profile image
        });

        return { success: true };
    } catch (error) {
        console.error("Prisma User Update Error:", error);
        return { success: false, error: "Failed to update account profile" };
    }
}

export async function deleteGeneration(generationId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const generation = await prisma.generation.findUnique({
            where: { id: generationId }
        });

        if (!generation || generation.userId !== session.user.id) {
            return { success: false, error: "Generation not found" };
        }

        await prisma.generation.delete({
            where: { id: generationId }
        });

        return { success: true };
    } catch (error) {
        console.error("Delete Generation Error:", error);
        return { success: false, error: "Failed to delete generation" };
    }
}
