'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function SignInPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                username,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Invalid credentials. Try artisan / thoub123");
            } else {
                // Successful login
                window.location.href = "/dashboard";
            }
        } catch (err) {
            setError("An unexpected error occurred.");
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
                    <h2 className="text-4xl font-black gold-gradient-text tracking-tighter uppercase mb-2">Artisan Login</h2>
                    <p className="text-white/40 text-xs tracking-widest uppercase">Enter the Digital Atelier</p>
                </div>

                <div className="bg-surface/50 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                    {/* Decorative scanning line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-sm" />

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black ml-1">Username</label>
                            <input
                                required
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="artisan"
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
                            {loading ? "Verifying..." : "Authenticate"}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 leading-relaxed">
                            Secured by Neural Encryption <br /> Authorized Personnel Only
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                        ← Return to Gallery
                    </Link>
                </div>
            </div>
        </div>
    );
}
