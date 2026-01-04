'use client';

import React from 'react';
import { createTopUpSession } from '@/app/actions/stripe';

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'measurement' | 'generation';
}

export default function TopUpModal({ isOpen, onClose, type }: TopUpModalProps) {
    const [loading, setLoading] = React.useState(false);

    if (!isOpen) return null;

    const handleTopUp = async () => {
        setLoading(true);
        try {
            const result = await createTopUpSession();

            if (result?.url) {
                window.location.href = result.url;
            } else if (result?.error) {
                alert(`Top-up error: ${result.error}`);
            } else {
                alert('An unexpected error occurred. No session URL returned.');
            }
        } catch (error: any) {
            console.error('Top-up error:', error);
            alert(`Failed to initiate top-up: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-black/90 border border-primary/30 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.2)] p-10 text-center relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div className="space-y-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Fuel the Atelier</h2>
                        <p className="text-white/60 text-sm font-light leading-relaxed">
                            {type === 'measurement'
                                ? "You've exhausted your biometric scan credits. Top up to continue your tailored journey."
                                : "Your bespoke generation bank is empty. Top up to weave new silhouettes."}
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                            <span className="text-white/40">Premium Credit Pack</span>
                            <span className="text-primary italic">£2.00</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-left">
                                <span className="text-[8px] text-white/30 block mb-1">Scans</span>
                                <span className="text-lg font-black text-white">+2</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-left">
                                <span className="text-[8px] text-white/30 block mb-1">Gens</span>
                                <span className="text-lg font-black text-white">+10</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleTopUp}
                        disabled={loading}
                        className="w-full btn-primary py-5 rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            "Instant Top Up"
                        )}
                    </button>

                    <p className="text-[10px] text-white/20 uppercase tracking-widest">Secure transaction via Stripe</p>
                </div>
            </div>
        </div>
    );
}
