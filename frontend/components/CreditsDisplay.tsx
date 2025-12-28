'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserCredits } from '@/app/actions/credits';

export default function CreditsDisplay() {
    const [credits, setCredits] = useState<{ measurement: number; generation: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCredits() {
            const result = await getUserCredits();
            if (result.success) {
                setCredits({
                    measurement: result.measurementCredits ?? 0,
                    generation: result.generationCredits ?? 0
                });
            }
            setLoading(false);
        }

        fetchCredits();

        // Refresh credits when tab gains focus to keep in sync
        const handleFocus = () => fetchCredits();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    if (loading) return <div className="animate-pulse bg-white/5 w-24 h-8 rounded-full" />;

    if (!credits) return null;

    const lowCredits = credits.measurement === 0 || credits.generation === 0;

    return (
        <Link href="/dashboard" className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/5 transition-all">
            <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Measure</span>
                <span className={`text-xs font-mono font-black ${credits.measurement === 0 ? 'text-red-400' : 'text-primary'}`}>
                    {credits.measurement}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Gen</span>
                <span className={`text-xs font-mono font-black ${credits.generation === 0 ? 'text-red-400' : 'text-primary'}`}>
                    {credits.generation}
                </span>
            </div>
            {lowCredits && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-1 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
        </Link>
    );
}
