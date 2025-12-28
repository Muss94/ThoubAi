'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-black to-black">
            <div className="max-w-2xl w-full text-center space-y-12 animate-reveal">
                <div className="space-y-4">
                    <div className="w-24 h-24 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <h1 className="text-6xl font-black gold-gradient-text tracking-tighter uppercase italic">Payment Secured</h1>
                    <p className="text-white/60 text-lg tracking-widest uppercase font-light">Your Bespoke Journey Begins Now</p>
                </div>

                <div className="bg-surface/50 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 space-y-8 relative overflow-hidden">
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.5em] text-primary/60 font-black">Order Reference</p>
                        <p className="text-sm font-mono text-white/40">{sessionId?.slice(0, 20)}...</p>
                    </div>

                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="space-y-6">
                        <p className="text-white/80 text-sm leading-loose max-w-md mx-auto">
                            The artisan has received your biometric blueprint. Our production cycles are now aligning with your precise specifications.
                        </p>
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-75" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-150" />
                            </div>
                            <span className="text-[9px] uppercase tracking-[0.4em] text-primary font-black">Authenticating Production</span>
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/dashboard"
                            className="bg-primary text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl shadow-primary/20"
                        >
                            Track My Order
                        </Link>
                        <Link
                            href="/catalogue"
                            className="bg-white/5 border border-white/10 text-white/80 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all"
                        >
                            Return to Gallery
                        </Link>
                    </div>
                </div>

                <p className="text-[10px] uppercase tracking-[0.5em] text-white/20">
                    A digital confirmation has been sent to your atelier account.
                </p>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-primary tracking-widest text-xs uppercase">Authenticating Checkout...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
