'use client';

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { registerUser } from "@/app/actions/auth";

export default function SignUpPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const result = await registerUser({ name, email, password });

            if (!result.success) {
                setError(result.error || "Registration failed");
                setLoading(false);
                return;
            }

            // Auto sign in after registration
            const signInResult = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (signInResult?.error) {
                setError("Account created! Please sign in.");
                window.location.href = "/auth/signin";
            } else {
                window.location.href = "/dashboard";
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-black to-black">
            <div className="max-w-md w-full animate-reveal">
                <div className="text-center mb-12">
                    <Link href="/" className="inline-flex items-center justify-center gap-6 group mb-8 hover:opacity-80 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        </div>
                        <h1 className="text-2xl font-black tracking-[0.4em] text-white uppercase italic">Thoub AI</h1>
                    </Link>
                    <h2 className="text-4xl font-black gold-gradient-text tracking-tighter uppercase mb-2">Create Account</h2>
                    <p className="text-white/40 text-xs tracking-widest uppercase">Join the Digital Atelier</p>
                </div>

                <div className="bg-surface/50 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-sm" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black ml-1">Full Name</label>
                            <input
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-white/10 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black ml-1">Email</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-white/10 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black ml-1">Password</label>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                minLength={8}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-white/10 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black ml-1">Confirm Password</label>
                            <input
                                required
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
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
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-[11px] text-white/40">
                            Already have an account?{" "}
                            <Link href="/auth/signin" className="text-primary font-bold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center relative z-50">
                    <Link href="/" className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors block py-2">
                        ← Return to Gallery
                    </Link>
                </div>
            </div>
        </div>
    );
}
