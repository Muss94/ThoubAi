'use client';

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            // We await the server action, but we don't expose if the email exists or not for security
            await requestPasswordReset(email);
            setMessage("If an account exists with this email, you will receive a password reset link shortly.");
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-black to-black">
            <div className="max-w-md w-full animate-reveal">
                <div className="text-center mb-12">
                    <Link href="/" className="inline-flex flex-col items-center group mb-8">
                        <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        </div>
                        <h1 className="text-2xl font-black tracking-[0.4em] text-white uppercase italic">Thoub AI</h1>
                    </Link>
                    <h2 className="text-3xl font-black gold-gradient-text tracking-tighter uppercase mb-2">Reset Password</h2>
                    <p className="text-white/40 text-xs tracking-widest uppercase">Recover Access to your Atelier</p>
                </div>

                <div className="bg-surface/50 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-sm" />

                    {!message ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black ml-1">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-white/10 transition-all"
                                />
                            </div>

                            {error && (
                                <p className="text-red-500/80 text-[10px] uppercase tracking-widest text-center animate-shake font-bold">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 rounded-2xl bg-primary text-black text-xs font-black uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:grayscale"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-4 space-y-6">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed">
                                {message}
                            </p>
                            <button
                                onClick={() => setMessage("")}
                                className="text-[10px] uppercase tracking-widest text-primary font-black hover:underline"
                            >
                                Try another email
                            </button>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <Link href="/auth/signin" className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                            ← Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
