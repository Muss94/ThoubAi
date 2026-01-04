'use client';

import { Suspense, useState, useEffect } from 'react';
import { getUserOrders } from '@/app/actions/checkout';
import Link from 'next/link';

interface OrderItem {
    id: string;
    config: any;
    quantity: number;
    unitAmount: number;
    measurement: {
        frontImageId: string;
        thobeLength: number;
        chest: number;
        sleeve: number;
        shoulder: number;
    };
}

interface Order {
    id: string;
    status: string;
    total: number;
    createdAt: Date | string;
    items: OrderItem[];
    shippingDetails: any;
}

function OrdersContent() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const result = await getUserOrders();
                if (result.error) {
                    setError(result.error);
                } else if (result.orders) {
                    setOrders(result.orders as any);
                }
            } catch (err) {
                setError('Failed to synchronize artisan ledger');
            } finally {
                setIsLoading(false);
            }
        }
        fetchOrders();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-8 animate-reveal">
                <div className="w-20 h-20 border-2 border-primary/10 border-t-primary rounded-full animate-spin flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_15px_#D4AF37]" />
                </div>
                <div className="space-y-3 text-center">
                    <span className="text-[12px] font-black uppercase tracking-[0.8em] text-primary/60 block">Artisan Vault</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/20">Decrypting Commission Data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6 text-center px-6">
                <h1 className="text-3xl font-black uppercase italic gold-gradient-text tracking-tighter">Atelier Desynchronization</h1>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest max-w-md leading-relaxed">{error}</p>
                <Link href="/dashboard" className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-primary transition-all">Return to Dashboard</Link>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white selection:bg-primary/30 font-sans relative overflow-x-hidden">
                <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a1a1a_0%,_transparent_70%)] pointer-events-none" />
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-40 pb-24 text-center">
                    <header className="mb-16 animate-reveal">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none gold-gradient-text drop-shadow-2xl">
                            Commissions <br /> Empty
                        </h1>
                    </header>
                    <div className="max-w-md mx-auto space-y-10 animate-reveal" style={{ animationDelay: '0.2s' }}>
                        <p className="text-white/30 text-xs font-bold uppercase tracking-widest leading-relaxed">
                            Your artisan queue is currently silent. <br /> Begin your journey by capturing your precision metrics.
                        </p>
                        <Link href="/capture" className="inline-block px-12 py-6 bg-primary text-black rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.2)] hover:scale-105 transition-all">Begin Tailoring</Link>
                    </div>
                </div>
                <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 font-sans relative overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a1a1a_0%,_transparent_70%)] pointer-events-none" />

            <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 lg:px-12 pt-40 pb-24">

                {/* Header */}
                <header className="mb-20 animate-reveal flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-[1px] w-12 bg-primary/40" />
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/80">Artisan Ledger</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none gold-gradient-text drop-shadow-2xl">
                            Your <br /> Commissions
                        </h1>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic">Validated Artisan Sessions</span>
                        <span className="text-4xl font-black italic gold-gradient-text leading-none">{orders.length}</span>
                    </div>
                </header>

                {/* Orders List */}
                <div className="space-y-12">
                    {orders.map((order, orderIdx) => (
                        <div
                            key={order.id}
                            className="bg-zinc-950/40 border border-white/5 rounded-[3rem] p-10 md:p-14 backdrop-blur-3xl shadow-3xl space-y-12 animate-reveal"
                            style={{ animationDelay: `${0.1 + orderIdx * 0.1}s` }}
                        >
                            {/* Order Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`h-2 w-2 rounded-full animate-pulse shadow-[0_0_10px] ${order.status === 'PAID' ? 'bg-green-500 shadow-green-500/50' :
                                                order.status === 'PROCESSING' ? 'bg-primary shadow-primary/50' :
                                                    'bg-white/20 shadow-white/10'
                                            }`} />
                                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/60">Session {order.status}</span>
                                    </div>
                                    <h2 className="text-xl font-mono text-primary/40 text-xs tracking-widest">ID: #{order.id.toUpperCase().slice(-8)}</h2>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-1">Commission Timestamp</span>
                                    <span className="text-sm font-black italic text-white/80">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {order.items.map((item, itemIdx) => (
                                    <div key={item.id} className="group relative bg-white/5 border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-8 hover:border-primary/20 transition-all">
                                        <div className="aspect-[4/5] w-full bg-black/40 rounded-[2rem] overflow-hidden flex items-center justify-center p-6 border border-white/5">
                                            {/* We don't have imageUrl directly on OrderItem in schema, but we can display style info */}
                                            {/* If we had it on Generation, we could link them. For now, let's show an avatar or placeholder */}
                                            <div className="relative w-full h-full flex flex-col items-center justify-center space-y-4">
                                                <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#D4AF37]" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{item.config.style.replace('_collar', '')}</p>
                                                    <p className="text-[8px] font-bold uppercase tracking-widest text-white/20">{item.config.fabric}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <span className="text-[8px] uppercase tracking-widest text-white/20 font-black block mb-1">Fabric & Pattern</span>
                                                    <span className="text-xs font-black uppercase italic text-white/80">{item.config.fabric}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[8px] uppercase tracking-widest text-white/20 font-black block mb-1">Quantity</span>
                                                    <span className="text-base font-black italic text-white">{item.quantity}</span>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                                {[
                                                    { l: "Length", v: item.measurement.thobeLength },
                                                    { l: "Chest", v: item.measurement.chest },
                                                ].map(m => (
                                                    <div key={m.l}>
                                                        <span className="text-[8px] uppercase tracking-widest text-white/10 font-bold block mb-1">{m.l}</span>
                                                        <span className="text-xs font-black italic text-white/60">{m.v}<span className="text-[8px] opacity-30 ml-0.5">cm</span></span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Footer */}
                            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary/50 block">Destination</span>
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">{order.shippingDetails?.address}, {order.shippingDetails?.city}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary/50 block">Recipient</span>
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">{order.shippingDetails?.name}</p>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 block">Commission Total</span>
                                    <div className="flex items-baseline justify-end gap-2">
                                        <span className="text-5xl font-black italic gold-gradient-text">${order.total / 100}</span>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-white/20">USD</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Disclaimer */}
                <div className="mt-32 text-center max-w-2xl mx-auto space-y-6 opacity-30">
                    <div className="h-px w-20 bg-white/20 mx-auto" />
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] leading-relaxed">
                        PRECISION TAILORING IS A CHOREOGRAPHED ART. EACH SESSION STATUS UPDATES <br />
                        AS OUR ARTISANS VERIFY AND EXECUTE YOUR BESPOKE CONFIGURATION.
                    </p>
                </div>
            </div>
            {/* Background Grid Accent */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
        </div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-8">
                <div className="w-20 h-20 border-2 border-primary/10 border-t-primary rounded-full animate-spin flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_15px_#D4AF37]" />
                </div>
                <div className="space-y-3 text-center text-primary/60">
                    <span className="text-[12px] font-black uppercase tracking-[0.8em] block">Artisan Vault</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/20">Synchronizing...</span>
                </div>
            </div>
        }>
            <OrdersContent />
        </Suspense>
    );
}
