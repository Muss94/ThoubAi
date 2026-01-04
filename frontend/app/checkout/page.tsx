'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createCheckoutSession, getUserCatalogue } from '@/app/actions/checkout';
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

interface CatalogueItem {
    id: string;
    imageUrl: string;
    config: any;
    measurement: {
        id: string;
        thobeLength: number;
        chest: number;
        sleeve: number;
        shoulder: number;
        heightCm: number;
    };
}

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();

    // Stepper State: 1: Verification, 2: Logistics, 3: Review
    const [step, setStep] = useState(1);

    // Commission List (Cart)
    const [orders, setOrders] = useState<OrderItem[]>([]);

    // Catalogue State
    const [catalogue, setCatalogue] = useState<CatalogueItem[]>([]);
    const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
    const [isLoadingCatalogue, setIsLoadingCatalogue] = useState(false);

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

    const handleOpenCatalogue = async () => {
        setIsCatalogueOpen(true);
        if (catalogue.length === 0) {
            setIsLoadingCatalogue(true);
            try {
                const result = await getUserCatalogue();
                if (result.generations) {
                    setCatalogue(result.generations as any);
                }
            } catch (error) {
                console.error("Failed to fetch catalogue:", error);
            } finally {
                setIsLoadingCatalogue(false);
            }
        }
    };

    const addToOrderFromCatalogue = (item: CatalogueItem) => {
        const newItem: OrderItem = {
            id: Math.random().toString(36).substr(2, 9),
            measurementId: item.measurement.id,
            fabric: item.config.fabric || 'White Cotton',
            pattern: item.config.pattern || 'Solid',
            style: item.config.style || 'Traditional',
            closure: item.config.closure || 'buttons',
            pocket: item.config.pocket === true,
            quantity: 1,
            imageUrl: item.imageUrl,
            metrics: {
                length: item.measurement.thobeLength.toString(),
                chest: item.measurement.chest.toString(),
                sleeve: item.measurement.sleeve.toString(),
                shoulder: item.measurement.shoulder.toString(),
                height: item.measurement.heightCm.toString(),
            }
        };
        setOrders(prev => [...prev, newItem]);
        setIsCatalogueOpen(false);
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
    const totalItems = orders.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 font-sans relative overflow-x-hidden">
            {/* Ambient Background Layer */}
            <div className="fixed inset-0 bg-[#020202] pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a1505_0%,_transparent_60%)] pointer-events-none opacity-40" />
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6.png")' }} />

            {/* Navigation / Progress Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 py-10 px-8 lg:px-16 flex justify-between items-center animate-fade-in">
                <Link href="/" className="group flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center artisan-border">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#D4AF37]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 group-hover:text-primary transition-colors">Thoub AI</span>
                </Link>

                <div className="flex items-center gap-12 bg-zinc-950/40 border border-white/5 backdrop-blur-3xl px-12 py-5 rounded-full shadow-2xl">
                    {[
                        { s: 1, l: "Verification" },
                        { s: 2, l: "Logistics" },
                        { s: 3, l: "Atelier" }
                    ].map(stepNode => (
                        <button
                            key={stepNode.s}
                            disabled={stepNode.s > step}
                            onClick={() => setStep(stepNode.s)}
                            className={`flex items-center gap-3 transition-all ${step === stepNode.s ? 'opacity-100 scale-105' : 'opacity-30 hover:opacity-100'}`}
                        >
                            <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border ${step === stepNode.s ? 'bg-primary border-primary text-black' : 'border-white/20 text-white'}`}>
                                {stepNode.s}
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-[0.3em]">{stepNode.l}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Artisan Session</span>
                    <span className="text-[11px] font-mono text-primary/60">#5512-XPQ</span>
                </div>
            </nav>

            <main className="relative z-10 w-full max-w-[1440px] mx-auto px-8 lg:px-16 pt-32 pb-40 grid grid-cols-1 lg:grid-cols-12 gap-16">

                {/* Left Content Area: Dynamic based on Step */}
                <div className="lg:col-span-8 flex flex-col gap-12 min-h-[600px]">

                    {step === 1 && (
                        <div className="animate-zoom-in space-y-12">
                            <header className="space-y-4">
                                <div className="flex items-center gap-4 text-primary">
                                    <div className="h-px w-12 bg-primary/40" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.6em]">Step 01 / Verification</span>
                                </div>
                                <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none gold-gradient-text">
                                    The Artisan <br /> Queue
                                </h1>
                                <p className="text-white/40 text-sm tracking-[0.1em] uppercase max-w-xl font-bold">Review your bespoke configurations before handing over to the master tailors. Precision is the cornerstone of the Digital Atelier.</p>
                            </header>

                            <div className="space-y-6">
                                {orders.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="group relative glass-luxury artisan-border rounded-[var(--radius-luxury)] p-10 flex flex-col md:flex-row gap-12 hover:border-primary/30 transition-all duration-700 animate-slide-up"
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        <div className="w-full md:w-60 lg:w-72 aspect-[3/4] rounded-[2rem] overflow-hidden bg-black/40 border border-white/5 relative artisan-border">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt="Bespoke Thobe"
                                                    className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-[2s] animate-breathing"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                                    <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Syncing Blueprint...</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between py-2">
                                            <div className="space-y-8">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">{item.style.replace('_collar', '')}</h3>
                                                        <div className="flex items-center gap-3 mt-3">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">{item.fabric}</span>
                                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{item.pattern}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] uppercase tracking-widest text-primary/30 font-black block mb-2 underline decoration-primary/20 underline-offset-8">Artisan Grade</span>
                                                        <span className="text-3xl font-black italic gold-gradient-text">$499</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 group/metrics relative">
                                                    {[
                                                        { label: "Length", value: item.metrics.length },
                                                        { label: "Chest", value: item.metrics.chest },
                                                        { label: "Sleeve", value: item.metrics.sleeve },
                                                        { label: "Shoulder", value: item.metrics.shoulder }
                                                    ].map(metric => (
                                                        <div key={metric.label} className="space-y-1">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">{metric.label}</span>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-xl font-black italic text-white/70">{metric.value}</span>
                                                                <span className="text-[9px] font-bold italic opacity-20 uppercase">cm</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-white/5 pt-8 mt-auto">
                                                <div className="flex items-center gap-8">
                                                    <div className="flex items-center gap-6 bg-black/60 border border-white/10 rounded-2xl px-6 py-3">
                                                        <button onClick={() => updateQuantity(item.id, -1)} className="text-white/20 hover:text-primary transition-colors font-black text-xl hover:scale-125 transition-transform">−</button>
                                                        <span className="text-sm font-black italic min-w-[20px] text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, 1)} className="text-white/20 hover:text-primary transition-colors font-black text-xl hover:scale-125 transition-transform">+</button>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeItem(item.id)} className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 hover:text-red-500/60 transition-colors py-2 group/remove">
                                                    Discard <span className="hidden group-hover/remove:inline ml-2 opacity-40 transition-all">Configuration</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={handleOpenCatalogue}
                                    className="w-full h-40 border border-dashed border-white/10 rounded-[var(--radius-luxury)] flex flex-col items-center justify-center gap-4 hover:bg-white/5 hover:border-primary/20 transition-all group animate-slide-up"
                                    style={{ animationDelay: '0.4s' }}
                                >
                                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:scale-125 transition-transform duration-500">
                                        <span className="text-primary text-2xl font-black">+</span>
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-white/20 group-hover:text-primary/60 transition-colors">Integrate from History</span>
                                </button>
                            </div>

                            <div className="flex justify-end pt-12">
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-16 h-20 bg-primary text-black rounded-[var(--radius-luxury)] text-xs font-black uppercase tracking-[0.4em] hover:scale-105 transition-all shadow-gold artisan-border"
                                >
                                    Advance to Logistics &rarr;
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-slide-in-right space-y-12 max-w-3xl">
                            <header className="space-y-4">
                                <div className="flex items-center gap-4 text-primary">
                                    <div className="h-px w-12 bg-primary/40" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.6em]">Step 02 / Logistics</span>
                                </div>
                                <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none gold-gradient-text">
                                    Recipient <br /> Destination
                                </h1>
                                <p className="text-white/40 text-sm tracking-[0.1em] uppercase max-w-xl font-bold">Secure the global hub for your artisan garments. Every stitch follows your signature.</p>
                            </header>

                            <div className="glass-luxury artisan-border rounded-[var(--radius-luxury)] p-12 space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3 group">
                                        <label className="text-[10px] uppercase tracking-[0.4em] text-primary/50 font-black ml-2 group-focus-within:text-primary transition-colors">Artisan Name</label>
                                        <input
                                            type="text"
                                            value={shipping.name}
                                            onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-black focus:bg-white/10 focus:border-primary/40 transition-all outline-none"
                                            placeholder="Mo Mussa"
                                        />
                                    </div>
                                    <div className="space-y-3 group">
                                        <label className="text-[10px] uppercase tracking-[0.4em] text-primary/50 font-black ml-2 group-focus-within:text-primary transition-colors">Artisan Nexus (City)</label>
                                        <input
                                            type="text"
                                            value={shipping.city}
                                            onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-black focus:bg-white/10 focus:border-primary/40 transition-all outline-none"
                                            placeholder="Riyadh"
                                        />
                                    </div>
                                    <div className="space-y-3 group md:col-span-2">
                                        <label className="text-[10px] uppercase tracking-[0.4em] text-primary/50 font-black ml-2 group-focus-within:text-primary transition-colors">Global Destination Header</label>
                                        <input
                                            type="text"
                                            value={shipping.address}
                                            onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-black focus:bg-white/10 focus:border-primary/40 transition-all outline-none"
                                            placeholder="Street, District, Building"
                                        />
                                    </div>
                                    <div className="space-y-3 group md:col-span-1">
                                        <label className="text-[10px] uppercase tracking-[0.4em] text-primary/50 font-black ml-2 group-focus-within:text-primary transition-colors">Contact Protocol</label>
                                        <input
                                            type="tel"
                                            value={shipping.phone}
                                            onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-black focus:bg-white/10 focus:border-primary/40 transition-all outline-none"
                                            placeholder="+966 ..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-12">
                                <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 hover:text-white transition-colors">
                                    &larr; Return to Verification
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!shipping.address || !shipping.city}
                                    className="px-16 h-20 bg-primary text-black rounded-[var(--radius-luxury)] text-xs font-black uppercase tracking-[0.4em] hover:scale-105 transition-all shadow-gold disabled:opacity-30 disabled:grayscale"
                                >
                                    Review Commission &rarr;
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in space-y-12">
                            <header className="space-y-4">
                                <div className="flex items-center gap-4 text-primary">
                                    <div className="h-px w-12 bg-primary/40" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.6em]">Step 03 / Final Atelier</span>
                                </div>
                                <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none gold-gradient-text">
                                    Handover <br /> Protocol
                                </h1>
                                <p className="text-white/40 text-sm tracking-[0.1em] uppercase max-w-xl font-bold">The ledger is ready. By commissioning, you activate our digital looms to begin crafting your bespoke legacy.</p>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="glass-luxury artisan-border rounded-[var(--radius-luxury)] p-12 space-y-10">
                                    <div className="space-y-6">
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Artisan Summary</h3>
                                        <div className="space-y-4">
                                            {orders.map(o => (
                                                <div key={o.id} className="flex justify-between items-center border-b border-white/5 pb-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{o.quantity}X {o.style}</span>
                                                    <span className="text-sm font-black italic">${o.quantity * 499}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/60 block mb-2">Commission Total</span>
                                            <span className="text-5xl font-black italic gold-gradient-text">${totalCost}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-luxury artisan-border rounded-[var(--radius-luxury)] p-12 space-y-10">
                                    <div className="space-y-6">
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Destination Proof</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-1">Recipient ID</span>
                                                <p className="text-sm font-black uppercase tracking-widest text-white/80">{shipping.name}</p>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-1">Logistics Hub</span>
                                                <p className="text-sm font-black uppercase tracking-widest text-white/80">{shipping.address}, {shipping.city}</p>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-1">Contact Protocol</span>
                                                <p className="text-sm font-black uppercase tracking-widest text-white/80">{shipping.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-12">
                                <button onClick={() => setStep(2)} className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 hover:text-white transition-colors">
                                    &larr; Refine Logistics
                                </button>
                                <button
                                    onClick={handleCommission}
                                    disabled={isProcessing}
                                    className="px-24 h-24 bg-primary text-black rounded-[var(--radius-luxury)] text-sm font-black uppercase tracking-[0.6em] hover:scale-105 transition-all shadow-gold shadow-[0_20px_60px_-10px_rgba(212,175,55,0.4)] disabled:opacity-50"
                                >
                                    {isProcessing ? "Processing Handover..." : "Handover to Atelier"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Content Area: Persistent Artisan Ledger */}
                <div className="lg:col-span-4 lg:pl-12 border-l border-white/5 lg:sticky lg:top-40 h-fit space-y-12 animate-slide-in-right">
                    <section className="space-y-10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#D4AF37]" />
                            <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Artisan Ledger</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Queue Items</span>
                                <span className="text-sm font-black italic">{totalItems} Thobes</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Atelier Access</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500/60 transition-all font-mono">Unlimited Verified</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Commission Rate</span>
                                <span className="text-sm font-black italic">$499.00 / ea</span>
                            </div>
                            <div className="h-px w-full bg-white/5" />
                            <div className="flex justify-between items-end pt-4">
                                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/60 italic">Collective Total</span>
                                <span className="text-5xl font-black italic gold-gradient-text tracking-tighter">${totalCost}</span>
                            </div>
                        </div>
                    </section>

                    <section className="glass-luxury artisan-border rounded-3xl p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Artisan Guarantee</h4>
                                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">Global Precision Verified</p>
                            </div>
                        </div>
                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest leading-relaxed">Each thobe is hand-verified for metric accuracy before shipping. Our digital-first model ensures bespoke perfection at an exclusive scale.</p>
                    </section>
                </div>
            </main>

            {/* Catalogue Selection Modal */}
            {isCatalogueOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-20 overflow-hidden">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-[40px] animate-fade-in" onClick={() => setIsCatalogueOpen(false)} />
                    <div className="relative w-full max-w-[1200px] bg-zinc-950 border border-white/10 rounded-[var(--radius-artisan)] shadow-4xl overflow-hidden animate-zoom-in flex flex-col max-h-[85vh] artisan-border">
                        <header className="p-12 border-b border-white/5 flex justify-between items-center bg-black/40">
                            <div>
                                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-primary mb-3 block">Digital Archive</span>
                                <h2 className="text-5xl font-black uppercase italic tracking-tighter gold-gradient-text leading-none">Your Bespoke Selection</h2>
                            </div>
                            <button onClick={() => setIsCatalogueOpen(false)} className="h-16 w-16 rounded-full border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all hover:rotate-90">
                                <span className="text-4xl font-black">×</span>
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            {isLoadingCatalogue ? (
                                <div className="h-[400px] flex flex-col items-center justify-center space-y-8">
                                    <div className="w-16 h-16 border-2 border-primary/10 border-t-primary rounded-full animate-spin flex items-center justify-center">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/20">Decrypting Catalogue Blueprint...</p>
                                </div>
                            ) : catalogue.length === 0 ? (
                                <div className="h-[400px] flex flex-col items-center justify-center space-y-8">
                                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest text-center">Your artisan history is currently empty.</p>
                                    <Link href="/capture" className="px-12 py-5 bg-primary text-black rounded-2xl text-[10px] font-black uppercase tracking-widest">Begin Tailoring</Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                                    {catalogue.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group bg-white/2 rounded-[var(--radius-luxury)] p-6 hover:border-primary/40 glass-luxury artisan-border border border-white/5 transition-all cursor-pointer relative"
                                            onClick={() => addToOrderFromCatalogue(item)}
                                        >
                                            <div className="aspect-[3/4] w-full rounded-[1.5rem] overflow-hidden bg-black/40 border border-white/5 mb-6 relative">
                                                <img src={item.imageUrl} alt="Catalogue Item" className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-[2s]" />
                                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                    <span className="text-[11px] font-black uppercase tracking-[0.4em] bg-primary text-black px-10 py-5 rounded-full shadow-gold">Integrate Thobe</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">{item.config.style.replace('_collar', '')}</h4>
                                                <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest">{item.config.fabric}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center space-y-10 animate-fade-in">
                <div className="w-24 h-24 border-2 border-primary/10 border-t-primary rounded-full animate-spin flex items-center justify-center artisan-border">
                    <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-[0_0_20px_#D4AF37]" />
                </div>
                <div className="space-y-3 text-center">
                    <span className="text-[14px] font-black uppercase tracking-[1em] block text-primary/60 gold-gradient-text">Artisan Vault</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/10">Synchronizing Session Protocol...</span>
                </div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
