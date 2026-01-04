import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, token: string) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    // Ensure we have a sender email configured, otherwise fallback to a testing one or raise error if critical
    const fromEmail = "Thoub AI <onboarding@resend.dev>"; // Default testing domain for Resend
    // Ideally user sets this in ENV: process.env.EMAIL_FROM

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || fromEmail,
            to: email,
            subject: 'Reset Your Thoub-AI Password',
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px;">
                                <!-- Logo -->
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(212, 175, 55, 0.2); border: 1px solid rgba(212, 175, 55, 0.4); display: inline-block; text-align: center; line-height: 50px;">
                                            <div style="width: 10px; height: 10px; border-radius: 50%; background: #D4AF37; display: inline-block;"></div>
                                        </div>
                                        <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 0.4em; text-transform: uppercase; font-style: italic; margin: 15px 0 0 0;">THOUB AI</h1>
                                    </td>
                                </tr>
                                
                                <!-- Card -->
                                <tr>
                                    <td style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 40px;">
                                        <h2 style="color: #D4AF37; font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 20px 0; text-align: center;">Password Reset</h2>
                                        
                                        <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                                            We received a request to reset your password. Click the button below to create a new password.
                                        </p>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center">
                                                    <a href="${resetUrl}" style="display: inline-block; background: #D4AF37; color: #000000; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">
                                                        Reset Password
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color: rgba(255, 255, 255, 0.3); font-size: 11px; text-align: center; margin: 30px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">
                                            This link expires in 1 hour
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding-top: 30px; text-align: center;">
                                        <p style="color: rgba(255, 255, 255, 0.2); font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">
                                            If you didn't request this, please ignore this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `
        });

        if (error) {
            console.error('Resend API Error:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }

        console.log(`Password reset email sent to ${email}`);
    } catch (error: any) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
}

export async function sendWelcomeEmail(email: string, name: string) {
    const fromEmail = "Thoub AI <onboarding@resend.dev>";
    // Ideally user sets this in ENV: process.env.EMAIL_FROM

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || fromEmail,
            to: email,
            subject: 'Welcome to the Digital Atelier',
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px;">
                                <!-- Logo -->
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(212, 175, 55, 0.2); border: 1px solid rgba(212, 175, 55, 0.4); display: inline-block; text-align: center; line-height: 50px;">
                                            <div style="width: 10px; height: 10px; border-radius: 50%; background: #D4AF37; display: inline-block;"></div>
                                        </div>
                                        <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 0.4em; text-transform: uppercase; font-style: italic; margin: 15px 0 0 0;">THOUB AI</h1>
                                    </td>
                                </tr>
                                
                                <!-- Card -->
                                <tr>
                                    <td style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 40px;">
                                        <h2 style="color: #D4AF37; font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 20px 0; text-align: center;">Welcome, Artisan</h2>
                                        
                                        <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                                            Your journey into bespoke digital tailoring begins now. We have credited your account with complimentary measurement tokens.
                                        </p>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center">
                                                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/capture" style="display: inline-block; background: #D4AF37; color: #000000; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">
                                                        Start Measuring
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding-top: 30px; text-align: center;">
                                        <p style="color: rgba(255, 255, 255, 0.2); font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">
                                            Thoub AI • The Digital Atelier
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `
        });

        if (error) {
            console.error('Resend API Error (Welcome):', error);
        } else {
            console.log(`Welcome email sent to ${email}`);
        }
    } catch (error: any) {
        console.error('Error sending welcome email:', error);
        // Don't throw here, passing silently as it's non-critical
    }
}
