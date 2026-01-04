'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createCheckoutSession } from '@/app/actions/checkout';
import Link from 'next/link';

interface OrderItem {
    id: string;
    measurementId: string;
    fabric: string;
    pattern: string;
    style: string;
    closure: string;
    pocket: boolean;
    quantity: number;
    imageUrl?: string;
    metrics: {
        length: string;
        chest: string;
        sleeve: string;
        shoulder: string;
        height: string;
    };
}

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();

    // Commission List (Cart)
    const [orders, setOrders] = useState<OrderItem[]>([]);

    // Shipping State
    const [shipping, setShipping] = useState({
        name: session?.user?.name || '',
        address: '',
        city: '',
        phone: '',
    });

    const [isProcessing, setIsProcessing] = useState(false);

    // Load initial item from URL
    useEffect(() => {
        const measurementId = searchParams.get('measurement_id');
        if (!measurementId) return;

        const newItem: OrderItem = {
            id: Math.random().toString(36).substr(2, 9),
            measurementId,
            fabric: searchParams.get('fabric') || 'White Cotton',
            pattern: searchParams.get('pattern') || 'Solid',
            style: searchParams.get('style') || 'Traditional',
            closure: searchParams.get('closure') || 'buttons',
            pocket: searchParams.get('pocket') === 'true',
            quantity: 1,
            imageUrl: searchParams.get('image_url') || undefined,
            metrics: {
                length: searchParams.get('thobe_length') || '0',
                chest: searchParams.get('chest') || '0',
                sleeve: searchParams.get('sleeve') || '0',
                shoulder: searchParams.get('shoulder') || '0',
                height: searchParams.get('height_cm') || '170',
            }
        };

        setOrders(prev => {
            if (prev.length === 0) return [newItem];
            return prev;
        });
    }, [searchParams]);

    // Sync session name
    useEffect(() => {
        if (session?.user?.name && !shipping.name) {
            setShipping(prev => ({ ...prev, name: session?.user?.name || '' }));
        }
    }, [session, shipping.name]);

    const addToOrder = () => {
        alert("Configuration synchronized with your artisan queue.");
    };

    const updateQuantity = (id: string, delta: number) => {
        setOrders(prev => prev.map(item =>
            item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        ));
    };

    const removeItem = (id: string) => {
        const newOrders = orders.filter(item => item.id !== id);
        setOrders(newOrders);
        if (newOrders.length === 0) router.push('/dashboard');
    };

    const handleCommission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (orders.length === 0 || isProcessing) return;

        if (!shipping.address || !shipping.city || !shipping.phone) {
            alert('Please complete all shipping details.');
            return;
        }

        setIsProcessing(true);
        try {
            const result = await createCheckoutSession({
                items: orders.map(o => ({
                    measurementId: o.measurementId,
                    config: {
                        fabric: o.fabric,
                        pattern: o.pattern,
                        style: o.style,
                        closure: o.closure,
                        pocket: o.pocket
                    },
                    quantity: o.quantity,
                    imageUrl: o.imageUrl
                })),
                shippingDetails: shipping
            });

            if (result.url) {
                window.location.href = result.url;
            } else {
                alert(result.error || 'Failed to initiate commission');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const totalCost = orders.reduce((acc, item) => acc + (499 * item.quantity), 0);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 font-sans relative overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a1a1a_0%,_transparent_70%)] pointer-events-none" />

            <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 lg:px-12 pt-32 pb-20">

                {/* Refined Header Section */}
                <header className="mb-12 animate-reveal flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-[1px] w-10 bg-primary/40" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/80">Artisan Verification</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-none gold-gradient-text drop-shadow-xl">
                            Bespoke <br /> Summary
                        </h1>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Artisan Session ID</span>
                        <span className="text-[11px] font-mono text-primary/40">#{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                    {/* Visual Section: Sleeker & More Focused */}
                    <div className="space-y-8 animate-reveal" style={{ animationDelay: '0.1s' }}>
                        <div className="relative group">
                            <div className="absolute -inset-10 bg-primary/5 rounded-full blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
                            <div className="relative aspect-[4/5] w-full flex items-center justify-center p-8 bg-zinc-950/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-2xl shadow-2xl">
                                {orders[0]?.imageUrl ? (
                                    <div className="w-full h-full relative animate-breathing flex items-center justify-center">
                                        <img
                                            src={orders[0].imageUrl}
                                            alt="Bespoke Thobe"
                                            className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.03)]"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Syncing Artisan Blueprint...</p>
                                    </div>
                                )}

                                <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-primary/60">Verification Focus</p>
                                        <h3 className="text-2xl font-black uppercase italic text-white tracking-tighter leading-none">Artisan Prime</h3>
                                    </div>
                                    <div className="h-12 w-12 rounded-full border border-white/5 flex items-center justify-center backdrop-blur-2xl bg-white/5">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_12px_#D4AF37]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Management: Compact Cards */}
                        <div className="space-y-4">
                            {orders.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className="bg-zinc-950/50 border border-white/5 rounded-[2rem] p-8 flex flex-col md:flex-row gap-8 hover:border-primary/20 transition-all group animate-reveal"
                                    style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
                                >
                                    <div className="flex-1 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-3xl font-black uppercase italic tracking-tighter text-white">{item.style.replace('_collar', '')}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] text-primary/60 tracking-widest uppercase font-black">{item.fabric}</span>
                                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                                    <span className="text-[9px] text-white/30 tracking-widest uppercase font-bold">{item.pattern}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary/40 block mb-1">Commission</span>
                                                <span className="text-xl font-black italic text-white">$499</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {[
                                                { l: "Chest", v: item.metrics.chest },
                                                { l: "Length", v: item.metrics.length },
                                                { l: "Sleeve", v: item.metrics.sleeve },
                                                { l: "Shoulder", v: item.metrics.shoulder },
                                            ].map(m => (
                                                <div key={m.l}>
                                                    <span className="text-[8px] uppercase tracking-widest text-white/20 font-black block mb-1">{m.l}</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-base font-black italic text-white/80">{m.v}</span>
                                                        <span className="text-[8px] opacity-20 font-bold uppercase italic">cm</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-full md:w-px bg-white/5" />

                                    <div className="flex flex-row md:flex-col justify-between items-center gap-6">
                                        <div className="space-y-2 text-center">
                                            <span className="text-[8px] uppercase tracking-widest text-primary/50 font-black block">Qty</span>
                                            <div className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-xl p-2 px-4 transition-transform group-hover:scale-105">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="text-white/30 hover:text-primary transition-colors font-black text-xl">−</button>
                                                <span className="text-sm font-black italic min-w-[18px]">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="text-white/30 hover:text-primary transition-colors font-black text-xl">+</button>
                                            </div>
                                        </div>
                                        <button onClick={() => removeItem(item.id)} className="text-[8px] uppercase tracking-widest text-white/20 hover:text-red-500/60 font-black transition-colors">Discard</button>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addToOrder}
                                className="w-full py-8 border border-dashed border-white/5 rounded-[2rem] flex items-center justify-center gap-4 hover:border-primary/20 hover:bg-white/5 transition-all group animate-reveal"
                                style={{ animationDelay: '0.4s' }}
                            >
                                <div className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform bg-white/5">
                                    <span className="text-primary font-black text-lg">+</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-primary/40 transition-colors">Add to Order</span>
                            </button>
                        </div>
                    </div>

                    {/* Shipping & Finalization: Tight & Elegant */}
                    <div className="animate-reveal" style={{ animationDelay: '0.3s' }}>
                        <div className="sticky top-32">
                            <div className="bg-zinc-950/60 border border-white/10 rounded-[2.5rem] p-10 md:p-12 shadow-3xl backdrop-blur-3xl space-y-10">
                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-black uppercase tracking-tighter italic gold-gradient-text">Delivery Nexus</h2>
                                    <p className="text-[9px] uppercase tracking-[0.5em] text-white/20 font-black">Global Artisan Logistics</p>
                                </div>

                                <form onSubmit={handleCommission} className="space-y-6">
                                    <div className="space-y-6">
                                        <div className="space-y-2 group">
                                            <label className="text-[9px] uppercase tracking-widest text-primary/50 font-black ml-4 group-focus-within:text-primary transition-colors">Recipient Identity</label>
                                            <input
                                                type="text"
                                                value={shipping.name}
                                                onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white/10 focus:border-primary/20 transition-all outline-none placeholder:text-white/10"
                                                placeholder="Artisan Signature"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2 group">
                                            <label className="text-[9px] uppercase tracking-widest text-primary/50 font-black ml-4 group-focus-within:text-primary transition-colors">Final Destination</label>
                                            <input
                                                type="text"
                                                value={shipping.address}
                                                onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white/10 focus:border-primary/20 transition-all outline-none placeholder:text-white/10"
                                                placeholder="Street, Suite, District"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2 group">
                                                <label className="text-[9px] uppercase tracking-widest text-primary/50 font-black ml-4 group-focus-within:text-primary transition-colors">City Hub</label>
                                                <input
                                                    type="text"
                                                    value={shipping.city}
                                                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white/10 focus:border-primary/20 transition-all outline-none placeholder:text-white/10"
                                                    placeholder="Riyadh"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-[9px] uppercase tracking-widest text-primary/50 font-black ml-4 group-focus-within:text-primary transition-colors">Contact Nexus</label>
                                                <input
                                                    type="tel"
                                                    value={shipping.phone}
                                                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white/10 focus:border-primary/20 transition-all outline-none placeholder:text-white/10"
                                                    placeholder="+966..."
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-10 border-t border-white/5 space-y-10">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-[9px] uppercase font-black tracking-[0.4em] text-white/20 block mb-1">Final Total</span>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black italic gold-gradient-text">${totalCost}</span>
                                                    <span className="text-[10px] text-white/20 uppercase font-black">USD</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[8px] text-white/10 uppercase font-black block mb-1">Status</span>
                                                <span className="text-[9px] text-primary/40 uppercase font-black tracking-widest">Awaiting Commission</span>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isProcessing || orders.length === 0}
                                            className="w-full h-20 bg-primary text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-[0_15px_30px_rgba(212,175,55,0.15)] hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(212,175,55,0.25)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:grayscale relative overflow-hidden group/btn"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-[1s] ease-in-out" />
                                            {isProcessing ? (
                                                <div className="w-6 h-6 border-3 border-black/30 border-t-black rounded-full animate-spin mx-auto" />
                                            ) : (
                                                <span className="relative z-10">Finalize Commission</span>
                                            )}
                                        </button>

                                        <p className="text-[8px] text-center text-white/10 uppercase tracking-[0.3em] font-black leading-relaxed">
                                            BY PROCEEDING, YOU AUTHORIZE THE ATELIER TO BEGIN TAILORING ON THESE SPECIFICATIONS. NO MODIFICATIONS POSSIBLE POST-COMMISSION.
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Minimal Grid Accent */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
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
                <div className="space-y-2 text-center text-primary/60">
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] block">Artisan Vault</span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/10">Synchronizing...</span>
                </div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
