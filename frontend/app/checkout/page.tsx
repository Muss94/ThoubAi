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
            setShipping(prev => ({ ...prev, name: session?.user?.name || '' }));
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
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 font-sans relative overflow-x-hidden">
            {/* Immersive Background */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a1a1a_0%,_transparent_70%)] pointer-events-none" />
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 pt-32 pb-24">

                {/* Header */}
                <header className="mb-16 animate-reveal">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-[1px] w-12 bg-primary/40" />
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/80">Commission Review</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none mb-6 gold-gradient-text drop-shadow-2xl">
                        Bespoke <br /> Summary
                    </h1>
                    <p className="text-white/40 text-xs md:text-sm tracking-widest uppercase max-w-2xl leading-relaxed font-bold italic">
                        Confirm your signature configuration and precision biometric profile before we synchronize with the atelier.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24">

                    {/* Left: Design & Specs */}
                    <div className="space-y-12 animate-reveal" style={{ animationDelay: '0.2s' }}>

                        {/* Artwork Showcase */}
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-3xl shadow-2xl">
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt="Bespoke Design"
                                        className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                        <div className="w-12 h-12 border border-white/10 rounded-full animate-spin flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_#D4AF37]" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Rendering Blueprint...</span>
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black via-black/80 to-transparent">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-2">
                                            <h3 className="text-3xl font-black uppercase italic italic">{style.replace('_collar', '')}</h3>
                                            <p className="text-[10px] text-white/50 tracking-[0.3em] font-black uppercase">Ref ID: {measurementId?.slice(-12)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-primary font-black uppercase tracking-widest text-[10px] block mb-1">Tailoring Grade</span>
                                            <span className="text-white font-black uppercase italic text-sm tracking-tighter">Artisan Prime</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-6 bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-3xl">
                            {[
                                { label: "Artisan Fabric", value: fabric },
                                { label: "Collar Archetype", value: style },
                                { label: "Pattern Selection", value: pattern },
                                { label: "Artisan Closure", value: closure },
                            ].map((spec) => (
                                <div key={spec.label} className="space-y-2">
                                    <span className="text-[9px] uppercase tracking-[0.2em] text-primary/60 font-black">{spec.label}</span>
                                    <p className="text-lg font-black text-white italic tracking-tight">{spec.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Precision Metrics */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/40">Precision Biometrics</h2>
                                <div className="h-[1px] flex-1 bg-white/10" />
                            </div>
                            <div className="flex flex-wrap gap-8">
                                {[
                                    { label: "Length", value: metrics.length },
                                    { label: "Chest", value: metrics.chest },
                                    { label: "Sleeve", value: metrics.sleeve },
                                    { label: "Shoulder", value: metrics.shoulder },
                                    { label: "Height", value: metrics.height },
                                ].map((m) => (
                                    <div key={m.label} className="space-y-1 min-w-[80px]">
                                        <span className="text-[8px] uppercase tracking-widest text-white/30 font-bold">{m.label}</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-white italic leading-none">{m.value}</span>
                                            <span className="text-[8px] opacity-30 font-bold uppercase tracking-tighter italic">cm</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Shipping & Action */}
                    <div className="animate-reveal" style={{ animationDelay: '0.4s' }}>
                        <div className="sticky top-32 group">
                            <div className="absolute -inset-1 bg-gradient-to-b from-primary/20 to-transparent rounded-[3.5rem] blur-xl opacity-30" />
                            <div className="relative bg-zinc-950 border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-3xl">
                                <div className="mb-12 text-center space-y-2">
                                    <h2 className="text-3xl font-black uppercase tracking-tighter italic gold-gradient-text">Artisan Portal</h2>
                                    <p className="text-[9px] uppercase tracking-[0.5em] text-white/30 font-bold">Secure Global Tailoring Service</p>
                                </div>

                                <form onSubmit={handlePayment} className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2 group/field">
                                            <label className="text-[9px] uppercase tracking-widest text-primary/70 font-black ml-4 group-focus-within/field:text-primary transition-colors">Recipient Full Name</label>
                                            <input
                                                type="text"
                                                value={shipping.name}
                                                onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold focus:bg-white/10 focus:border-primary/30 transition-all outline-none placeholder:text-white/10"
                                                placeholder="Artisan Signature"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2 group/field">
                                            <label className="text-[9px] uppercase tracking-widest text-primary/70 font-black ml-4 group-focus-within/field:text-primary transition-colors">Shipping Blueprint (Address)</label>
                                            <input
                                                type="text"
                                                value={shipping.address}
                                                onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold focus:bg-white/10 focus:border-primary/30 transition-all outline-none placeholder:text-white/10"
                                                placeholder="123 Signature Ave"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2 group/field">
                                                <label className="text-[9px] uppercase tracking-widest text-primary/70 font-black ml-4 group-focus-within/field:text-primary transition-colors">City</label>
                                                <input
                                                    type="text"
                                                    value={shipping.city}
                                                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold focus:bg-white/10 focus:border-primary/30 transition-all outline-none placeholder:text-white/10"
                                                    placeholder="Artisan Hub"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2 group/field">
                                                <label className="text-[9px] uppercase tracking-widest text-primary/70 font-black ml-4 group-focus-within/field:text-primary transition-colors">Nexus (Phone)</label>
                                                <input
                                                    type="tel"
                                                    value={shipping.phone}
                                                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold focus:bg-white/10 focus:border-primary/30 transition-all outline-none placeholder:text-white/10"
                                                    placeholder="+Nexus ID"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-10 border-t border-white/5 space-y-10">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <span className="text-[8px] uppercase font-black tracking-[0.4em] text-white/20">Total Commission</span>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-5xl font-black italic gold-gradient-text">$499</span>
                                                    <span className="text-[10px] text-white/30 uppercase font-bold">USD</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[8px] text-white/20 uppercase font-black block mb-1">Tailoring Time</span>
                                                <span className="text-[10px] text-primary/60 uppercase font-black">12-14 Days</span>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isProcessing}
                                            className="w-full h-20 bg-primary text-black rounded-3xl text-sm font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(212,175,55,0.25)] hover:scale-[1.02] hover:shadow-[0_25px_50px_rgba(212,175,55,0.35)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-4 relative overflow-hidden group/btn"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                                            {isProcessing ? (
                                                <>
                                                    <div className="w-5 h-5 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                                                    <span className="relative z-10">Syncing with Atelier...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="relative z-10">Finalize Tailoring</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 group-hover/btn:translate-x-1 transition-transform">
                                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>

                                        <p className="text-[8px] text-center text-white/10 uppercase tracking-[0.3em] font-bold leading-relaxed px-8">
                                            By finalizing, you verify that all dimension profiles and artisan selections are accurate. Commissions are non-refundable once tailoring commences.
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 border-2 border-primary/10 border-t-primary rounded-full animate-spin flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
                <div className="space-y-2 text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/60 block">Bespoke Vault</span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/20">Decrypting Artisan Files...</span>
                </div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
