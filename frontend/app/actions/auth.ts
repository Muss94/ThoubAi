'use server';

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * Register a new user with email and password
 */
export async function registerUser(data: {
    name: string;
    email: string;
    password: string;
}) {
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return { success: false, error: "An account with this email already exists" };
        }

        // Validate password strength
        if (data.password.length < 8) {
            return { success: false, error: "Password must be at least 8 characters" };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Create user with starter credits
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                measurementCredits: 1,
                generationCredits: 3,
            }
        });

        return { success: true, userId: user.id };
    } catch (error) {
        console.error("Registration error:", error);
        return { success: false, error: "Failed to create account" };
    }
}

/**
 * Request a password reset email
 */
export async function requestPasswordReset(email: string) {
    try {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return { success: true };
        }

        // Delete any existing reset tokens for this email
        await prisma.passwordResetToken.deleteMany({
            where: { email }
        });

        // Generate reset token
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 3600000); // 1 hour from now

        // Save token to database
        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expires,
            }
        });

        // Send reset email
        await sendPasswordResetEmail(email, token);

        return { success: true };
    } catch (error) {
        console.error("Password reset request error details:", JSON.stringify(error, null, 2));
        // Return true anyway for security, but log the failure
        return { success: true };
    }
}

/**
 * Reset password using token
 */
export async function resetPassword(token: string, newPassword: string) {
    try {
        // Find valid token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken) {
            return { success: false, error: "Invalid or expired reset link" };
        }

        // Check if token is expired
        if (resetToken.expires < new Date()) {
            // Delete expired token
            await prisma.passwordResetToken.delete({
                where: { id: resetToken.id }
            });
            return { success: false, error: "Reset link has expired" };
        }

        // Validate new password
        if (newPassword.length < 8) {
            return { success: false, error: "Password must be at least 8 characters" };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user password
        await prisma.user.update({
            where: { email: resetToken.email },
            data: { password: hashedPassword }
        });

        // Delete used token
        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id }
        });

        return { success: true };
    } catch (error) {
        console.error("Password reset error:", error);
        return { success: false, error: "Failed to reset password" };
    }
}

/**
 * Verify if a reset token is valid
 */
export async function verifyResetToken(token: string) {
    try {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken || resetToken.expires < new Date()) {
            return { valid: false };
        }

        return { valid: true, email: resetToken.email };
    } catch (error) {
        return { valid: false };
    }
}
