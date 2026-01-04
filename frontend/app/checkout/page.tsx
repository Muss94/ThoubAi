'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createCheckoutSession } from '@/app/actions/checkout';
import Link from 'next/link';

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();

    // Bespoke Data from URL
    const measurementId = searchParams.get('measurement_id');
    const fabric = searchParams.get('fabric') || 'White Cotton';
    const pattern = searchParams.get('pattern') || 'Solid';
    const style = searchParams.get('style') || 'Traditional';
    const closure = searchParams.get('closure') || 'buttons';
    const pocket = searchParams.get('pocket') === 'true';
    const imageUrl = searchParams.get('image_url');

    // Metrics
    const metrics = {
        length: searchParams.get('thobe_length') || '0',
        chest: searchParams.get('chest') || '0',
        sleeve: searchParams.get('sleeve') || '0',
        shoulder: searchParams.get('shoulder') || '0',
        height: searchParams.get('height_cm') || '170',
    };

    // Shipping State
    const [shipping, setShipping] = useState({
        name: session?.user?.name || '',
        address: '',
        city: '',
        phone: '',
    });

    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!measurementId) {
            router.push('/dashboard');
        }
        if (session?.user?.name && !shipping.name) {
            setShipping(prev => ({ ...prev, name: session.user.name || '' }));
        }
    }, [measurementId, session, router, shipping.name]);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!measurementId || isProcessing) return;

        if (!shipping.address || !shipping.city || !shipping.phone) {
            alert('Please complete all shipping details.');
            return;
        }

        setIsProcessing(true);
        try {
            const result = await createCheckoutSession({
                measurementId: measurementId,
                config: {
                    fabric,
                    pattern,
                    style,
                    closure,
                    pocket
                },
                shippingDetails: shipping
            });

            if (result.url) {
                window.location.href = result.url;
            } else {
                alert(result.error || 'Failed to initiate payment');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 pt-32 font-sans overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-black to-black">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-reveal">
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Artisan Verification</span>
                        <h1 className="text-5xl font-black tracking-tighter uppercase italic gold-gradient-text">Bespoke Summary</h1>
                        <p className="text-white/40 text-[10px] tracking-widest uppercase max-w-xl leading-relaxed font-bold">
                            Review your signature configuration and finalize your commission details.
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left: Summary Cards */}
                    <div className="lg:col-span-7 space-y-8 animate-reveal" style={{ animationDelay: '0.2s' }}>

                        {/* 1. Configuration Review */}
                        <div className="bg-surface/30 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden group">
                            <div className="flex justify-between items-center relative z-10">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black uppercase tracking-tighter italic italic">Artisan Specs</h2>
                                    <div className="h-[2px] w-8 bg-primary" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Ref: {measurementId?.slice(-8)}</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                                {[
                                    { label: "Fabric", value: fabric },
                                    { label: "Style", value: style },
                                    { label: "Pattern", value: pattern },
                                    { label: "Closure", value: closure },
                                ].map((spec) => (
                                    <div key={spec.label} className="space-y-1">
                                        <span className="text-[9px] uppercase tracking-widest text-primary/60 font-black">{spec.label}</span>
                                        <p className="text-sm font-black text-white italic truncate">{spec.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 bg-black/40">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Bespoke Design" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-white/10 italic text-xs font-black uppercase tracking-widest">
                                        Visualization Sample
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Biometric Data */}
                        <div className="bg-surface/30 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
                            <div className="space-y-1 relative z-10">
                                <h2 className="text-xl font-black uppercase tracking-tighter italic">Precision Metrics</h2>
                                <div className="h-[2px] w-8 bg-primary" />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative z-10">
                                {[
                                    { label: "Length", value: metrics.length },
                                    { label: "Chest", value: metrics.chest },
                                    { label: "Sleeve", value: metrics.sleeve },
                                    { label: "Shoulder", value: metrics.shoulder },
                                    { label: "Height", value: metrics.height },
                                ].map((m) => (
                                    <div key={m.label} className="space-y-1">
                                        <span className="text-[9px] uppercase tracking-widest text-primary/60 font-black">{m.label}</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-mono font-black text-white italic">{m.value}</span>
                                            <span className="text-[8px] opacity-30 font-bold uppercase">cm</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Shipping & Action */}
                    <div className="lg:col-span-5 animate-reveal" style={{ animationDelay: '0.4s' }}>
                        <div className="bg-surface border border-white/10 rounded-[3rem] p-10 space-y-10 sticky top-32 shadow-2xl">
                            <div className="space-y-1 relative z-10 text-center">
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic gold-gradient-text">Delivery Portal</h2>
                                <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Secure Artisan Shipping</p>
                            </div>

                            <form onSubmit={handlePayment} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-widest text-primary font-black ml-4">Recipient Name</label>
                                        <input
                                            type="text"
                                            value={shipping.name}
                                            onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                            placeholder="Full Name"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-widest text-primary font-black ml-4">Street Address</label>
                                        <input
                                            type="text"
                                            value={shipping.address}
                                            onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                            placeholder="123 Artisan Way"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] uppercase tracking-widest text-primary font-black ml-4">City</label>
                                            <input
                                                type="text"
                                                value={shipping.city}
                                                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                                placeholder="Riyadh"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] uppercase tracking-widest text-primary font-black ml-4">Phone</label>
                                            <input
                                                type="tel"
                                                value={shipping.phone}
                                                onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                                placeholder="+966..."
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/10 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Commission Total</span>
                                        <div className="text-right">
                                            <span className="text-4xl font-black italic gold-gradient-text">$499</span>
                                            <span className="text-[10px] text-white/30 uppercase font-bold ml-2">USD</span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="w-full btn-primary py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                <span>Finalizing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Proceed to Payment</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                            </>
                                        )}
                                    </button>

                                    <p className="text-[8px] text-center text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                                        Crafted bespoke to your dimensions. <br />
                                        Expected craftsmanship: 12-14 days.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid background decoration */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] animate-pulse">
                <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Opening Artisan Vault...</span>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
