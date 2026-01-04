'use client';

import { Suspense } from 'react';
import Link from 'next/link';

function OrdersContent() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 font-sans relative overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a1a1a_0%,_transparent_70%)] pointer-events-none" />

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-40 pb-24 text-center">
                <header className="mb-16 animate-reveal">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="h-[1px] w-12 bg-primary/40" />
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/80">Artisan Queue</span>
                        <div className="h-[1px] w-12 bg-primary/40" />
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black tracking-tighter uppercase italic leading-none gold-gradient-text drop-shadow-2xl">
                        Your <br /> Commissions
                    </h1>
                </header>

                <div className="max-w-2xl mx-auto space-y-12 animate-reveal" style={{ animationDelay: '0.2s' }}>
                    <div className="bg-zinc-950/50 border border-white/5 rounded-[3rem] p-16 space-y-8 backdrop-blur-3xl shadow-3xl">
                        <div className="w-20 h-20 rounded-full border border-primary/20 flex items-center justify-center mx-auto bg-primary/5">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_15px_#D4AF37]" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Synchronizing Atelier...</h2>
                            <p className="text-white/30 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                Our artisans are currently finalizing the digital ledger. <br />
                                Soon you will be able to track every stitch of your bespoke commissions in real-time.
                            </p>
                        </div>
                        <div className="pt-8">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-4 px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/60 hover:text-primary active:scale-[0.98]"
                            >
                                Return to Dashboard
                            </Link>
                        </div>
                    </div>

                    <p className="text-[8px] text-white/10 uppercase tracking-[0.5em] font-black leading-relaxed">
                        PRECISION TAILORING REQUIRES PATIENCE. <br />
                        EACH GARMENT IS HAND-VERIFIED BY OUR DIGITAL ATELIER BEFORE COMMENCEMENT.
                    </p>
                </div>
            </div>
            {/* Background Grid Accent */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={null}>
            <OrdersContent />
        </Suspense>
    );
}
