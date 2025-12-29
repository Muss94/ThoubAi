'use client';

import React from 'react';
import { createTopUpSession } from '@/app/actions/stripe';

interface CreditStatusProps {
    measurementCredits: number;
    generationCredits: number;
}

export default function CreditStatus({ measurementCredits, generationCredits }: CreditStatusProps) {
    const [loading, setLoading] = React.useState(false);

    const handleTopUp = async () => {
        setLoading(true);
        try {
            const result = await createTopUpSession();

            if (result.error) {
                alert(result.error);
            } else if (result.url) {
                window.location.href = result.url;
            } else {
                alert('Failed to initiate top-up. Please try again.');
            }
        } catch (error) {
            console.error('Top-up error:', error);
            alert('Failed to initiate top-up. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Neural Credits</h3>
                <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Active Balance</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 group hover:border-primary/30 transition-all">
                    <span className="text-[10px] uppercase text-white/30 block mb-2 font-black tracking-widest">Biometric Scans</span>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-white">{measurementCredits}</span>
                        <span className="text-[10px] text-primary/60 font-bold mb-1 tracking-tighter uppercase italic">Credits</span>
                    </div>
                </div>
                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 group hover:border-primary/30 transition-all">
                    <span className="text-[10px] uppercase text-white/30 block mb-2 font-black tracking-widest">AI Generations</span>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-white">{generationCredits}</span>
                        <span className="text-[10px] text-primary/60 font-bold mb-1 tracking-tighter uppercase italic">Credits</span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleTopUp}
                disabled={loading}
                className="w-full btn-primary py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center justify-center gap-3 group"
            >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                    <>
                        <span>TOP UP CREDITS</span>
                        <div className="flex flex-col items-start leading-none gap-0.5">
                            <span className="text-[8px] opacity-60">£2 for +2 Scale & +10 Bespoke</span>
                        </div>
                    </>
                )}
            </button>
        </div>
    );
}
