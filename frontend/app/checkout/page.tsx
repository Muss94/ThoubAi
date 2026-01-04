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

        // Check if item already exists to prevent duplication on re-renders
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
        // Since we are on the review page, "Add to Order" for the same item 
        // can act as a way to clone the config or just provide feedback.
        // For a more complete experience, this could navigate back to try-on
        // while preserving the current "cart" in global state/localStorage.
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

            <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 pt-40 pb-24">

                {/* Header Section */}
                <header className="mb-20 animate-reveal">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-[1px] w-12 bg-primary/40" />
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/80">Artisan Verification</span>
                    </div>
                    <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic leading-[0.8] gold-gradient-text drop-shadow-2xl">
                        Bespoke <br /> Summary
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">

                    {/* Visual Section: Zoomed Out & Breathing */}
                    <div className="space-y-12 animate-reveal" style={{ animationDelay: '0.2s' }}>
                        <div className="relative group">
                            <div className="absolute -inset-20 bg-primary/5 rounded-full blur-[120px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
                            <div className="relative aspect-[3/4] md:aspect-[4/5] w-full flex items-center justify-center p-12 bg-zinc-950/40 border border-white/5 rounded-[4rem] overflow-hidden backdrop-blur-3xl shadow-3xl">
                                {orders[0]?.imageUrl ? (
                                    <div className="w-full h-full relative animate-breathing flex items-center justify-center">
                                        <img
                                            src={orders[0].imageUrl}
                                            alt="Bespoke Thobe"
                                            className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center space-y-6">
                                        <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto flex items-center justify-center">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Decrypting Artisan Blueprint...</p>
                                    </div>
                                )}

                                <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/60">Verification Focus</p>
                                        <h3 className="text-3xl font-black uppercase italic text-white tracking-tighter leading-none">Artisan Prime</h3>
                                    </div>
                                    <div className="h-14 w-14 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-2xl bg-white/5">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_15px_#D4AF37]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Management Cards */}
                        <div className="space-y-8">
                            {orders.map((item) => (
                                <div key={item.id} className="bg-white/5 border border-white/10 rounded-[3rem] p-10 md:p-12 flex flex-col md:flex-row gap-12 hover:border-primary/20 transition-all group relative overflow-hidden">
                                    <div className="flex-1 space-y-10">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-4xl font-black uppercase italic tracking-tighter text-white drop-shadow-md">{item.style.replace('_collar', '')}</h4>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[10px] text-primary/60 tracking-widest uppercase font-black">{item.fabric}</span>
                                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                                    <span className="text-[10px] text-white/40 tracking-widest uppercase font-bold">{item.pattern}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 block mb-1">Price / Unit</span>
                                                <span className="text-3xl font-black italic text-white">$499</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                                            {[
                                                { l: "Chest", v: item.metrics.chest },
                                                { l: "Length", v: item.metrics.length },
                                                { l: "Sleeve", v: item.metrics.sleeve },
                                                { l: "Shoulder", v: item.metrics.shoulder },
                                            ].map(m => (
                                                <div key={m.l}>
                                                    <span className="text-[9px] uppercase tracking-widest text-white/20 font-black block mb-2">{m.l}</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-black italic text-white">{m.v}</span>
                                                        <span className="text-[9px] opacity-30 font-bold uppercase italic">cm</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-full md:w-px bg-white/5" />

                                    <div className="flex flex-row md:flex-col justify-between items-center gap-8">
                                        <div className="space-y-3 text-center">
                                            <span className="text-[9px] uppercase tracking-widest text-primary/60 font-black block">Quantity</span>
                                            <div className="flex items-center gap-6 bg-black/40 border border-white/10 rounded-2xl p-3 px-5 transition-transform group-hover:scale-105">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="text-white/40 hover:text-primary transition-colors font-black text-2xl">−</button>
                                                <span className="text-xl font-black italic min-w-[24px]">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="text-white/40 hover:text-primary transition-colors font-black text-2xl">+</button>
                                            </div>
                                        </div>
                                        <button onClick={() => removeItem(item.id)} className="text-[9px] uppercase tracking-widest text-white/20 hover:text-red-500/60 font-black transition-colors py-2">Discard</button>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addToOrder}
                                className="w-full py-10 border-2 border-dashed border-white/5 rounded-[3.5rem] flex items-center justify-center gap-5 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                            >
                                <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform bg-white/5">
                                    <span className="text-primary font-black text-xl">+</span>
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.5em] text-white/30 group-hover:text-primary/60 transition-colors">Add to Order</span>
                            </button>
                        </div>
                    </div>

                    {/* Shipping & Finalization Portal */}
                    <div className="animate-reveal" style={{ animationDelay: '0.4s' }}>
                        <div className="sticky top-40">
                            <div className="bg-zinc-950/80 border border-white/10 rounded-[4rem] p-12 md:p-16 shadow-2xl backdrop-blur-3xl space-y-12">
                                <div className="text-center space-y-3">
                                    <h2 className="text-4xl font-black uppercase tracking-tighter italic gold-gradient-text">Delivery Nexus</h2>
                                    <p className="text-[10px] uppercase tracking-[0.6em] text-white/30 font-black">Secure Global Commissioning</p>
                                </div>

                                <form onSubmit={handleCommission} className="space-y-10">
                                    <div className="space-y-8">
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] uppercase tracking-widest text-primary/70 font-black ml-6 group-focus-within:text-primary transition-colors">Recipient Identity</label>
                                            <input
                                                type="text"
                                                value={shipping.name}
                                                onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-6 text-sm font-bold focus:bg-white/10 focus:border-primary/30 transition-all outline-none"
                                                placeholder="Artisan Signature"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-[10px] uppercase tracking-widest text-primary/70 font-black ml-6 group-focus-within:text-primary transition-colors">Strategic Destination (Address)</label>
                                            <input
                                                type="text"
                                                value={shipping.address}
                                                onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                                                className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-6 text-sm font-bold focus:bg-white/10 focus:border-primary/30 transition-all outline-none"
                                                placeholder="123 Signature Ave"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-3 group">
                                                <label className="text-[10px] uppercase tracking-widest text-primary/70 font-black ml-6 group-focus-within:text-primary transition-colors">City Hub</label>
                                                <input
                                                    type="text"
                                                    value={shipping.city}
                                                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-6 text-sm font-bold focus:bg-white/10 focus:border-primary/30 transition-all outline-none"
                                                    placeholder="Riyadh"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-3 group">
                                                <label className="text-[10px] uppercase tracking-widest text-primary/70 font-black ml-6 group-focus-within:text-primary transition-colors">Contact Nexus</label>
                                                <input
                                                    type="tel"
                                                    value={shipping.phone}
                                                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-6 text-sm font-bold focus:bg-white/10 focus:border-primary/30 transition-all outline-none"
                                                    placeholder="+966..."
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-14 border-t border-white/5 space-y-14">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-[10px] uppercase font-black tracking-[0.5em] text-white/20 block mb-2">Final Commission</span>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-6xl font-black italic gold-gradient-text">${totalCost}</span>
                                                    <span className="text-sm text-white/30 uppercase font-black">USD</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] text-white/20 uppercase font-black block mb-2">Tailoring Slot</span>
                                                <span className="text-[11px] text-primary/60 uppercase font-black tracking-widest">Reserved (14 Days)</span>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isProcessing || orders.length === 0}
                                            className="w-full h-28 bg-primary text-black rounded-[2.5rem] text-sm font-black uppercase tracking-[0.5em] shadow-[0_25px_50px_rgba(212,175,55,0.25)] hover:scale-[1.02] hover:shadow-[0_30px_60px_rgba(212,175,55,0.35)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:grayscale relative overflow-hidden group/btn"
                                        >
                                            <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-[1.2s] ease-in-out" />
                                            {isProcessing ? (
                                                <div className="w-8 h-8 border-4 border-black/30 border-t-black rounded-full animate-spin mx-auto" />
                                            ) : (
                                                <span className="relative z-10">Commission Artisans</span>
                                            )}
                                        </button>

                                        <p className="text-[9px] text-center text-white/10 uppercase tracking-[0.5em] font-black leading-relaxed px-10">
                                            BY COMMISSIONING, YOU ACKNOWLEDGE THE BESPOKE NATURE OF THIS GARMENT. CHANGES CANNOT BE MADE ONCE THE ATELIER SYNCHRONIZATION COMMENCES.
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Background Grid Accent */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-8">
                <div className="w-20 h-20 border-2 border-primary/10 border-t-primary rounded-full animate-spin flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                </div>
                <div className="space-y-3 text-center">
                    <span className="text-[12px] font-black uppercase tracking-[0.8em] text-primary/60 block">Artisan Vault</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/20">Decrypting Commission Data...</span>
                </div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
