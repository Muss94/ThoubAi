'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

function WaitlistModal({ isOpen, onClose, collectionTitle }: { isOpen: boolean; onClose: () => void; collectionTitle: string }) {
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            onClose();
            setSubmitted(false);
        }, 3000);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-fade-in">
            <div className="bg-surface border border-white/10 rounded-[2.5rem] p-10 max-w-lg w-full relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {submitted ? (
                    <div className="text-center py-12 animate-reveal">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/40">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h2 className="text-3xl font-black gold-gradient-text tracking-tighter mb-4">CONFIRMED</h2>
                        <p className="text-white/60 text-sm">You are successfully enrolled in the {collectionTitle} waitlist. Our artisan will contact you via WhatsApp shortly.</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-10">
                            <span className="text-primary tracking-[0.4em] text-[10px] font-black uppercase mb-2 block">Priority Access</span>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">JOIN WAITLIST</h2>
                            <p className="text-white/40 text-xs italic">{collectionTitle}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[9px] uppercase tracking-widest text-primary/60 font-black ml-1">Full Name</label>
                                <input required type="text" placeholder="Abdullah Al-Saudi" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-white/10" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] uppercase tracking-widest text-primary/60 font-black ml-1">Email Address</label>
                                <input required type="email" placeholder="abdullah@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-white/10" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-widest text-primary/60 font-black ml-1">WhatsApp Number</label>
                                    <input required type="tel" placeholder="+966 --- --- ---" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-white/10" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-widest text-primary/60 font-black ml-1">City</label>
                                    <input required type="text" placeholder="Riyadh" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-white/10" />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 rounded-xl bg-primary text-black text-xs font-black uppercase tracking-[0.3em] hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)] mt-4"
                            >
                                SECURE MY SPOT
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default function CataloguePage() {
    const router = useRouter();
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

    const collections = [
        {
            title: "Winter Warm Collection",
            desc: "Heavyweight wool-blend textiles designed for depth and durability in the cooler months.",
            image: "/winter-warm.jpg",
            price: "Seasonal"
        },
        {
            title: "Summer Cool Collection",
            desc: "Ultra-breathable linen and lightweight cottons for maximum airflow and comfort.",
            image: "/summer-cool.jpg",
            price: "Signature"
        },
        {
            title: "VIP Collection",
            desc: "Exquisite hand-stitched detailing and rare textiles for the most discerning connoisseur.",
            image: "/vip-collection.jpg",
            price: "Elite"
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-24 overflow-x-hidden pt-32">
            <WaitlistModal
                isOpen={!!selectedCollection}
                onClose={() => setSelectedCollection(null)}
                collectionTitle={selectedCollection || ''}
            />

            <header className="max-w-6xl mx-auto mb-20 animate-fade-in">
                <div className="flex flex-col items-center text-center">
                    <span className="text-primary tracking-[0.5em] text-xs uppercase mb-4">Atelier Exhibition</span>
                    <h1 className="text-5xl md:text-7xl font-black gold-gradient-text tracking-tighter mb-6 uppercase italic">THE CATALOGUE</h1>
                    <div className="h-[2px] w-48 bg-primary/30 mb-8" />
                    <p className="text-white/40 text-lg max-w-2xl font-light leading-relaxed">
                        Explore our curated selection of bespoke silhouettes. Each design is a synthesis of traditional craftsmanship and neural precision.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {collections.map((item, idx) => (
                        <div
                            key={item.title}
                            className="group relative bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden transition-all duration-700 hover:scale-[1.02] hover:border-primary/40 shadow-2xl animate-reveal"
                            style={{ animationDelay: `${idx * 0.2}s` }}
                        >
                            <div className="aspect-[4/5] relative overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 group-hover:rotate-1"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />

                                <div className="absolute top-6 right-6">
                                    <div className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                                        <span className="text-[10px] font-black tracking-widest uppercase gold-gradient-text">{item.price}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 space-y-4">
                                <h2 className="text-2xl font-black text-white/90 tracking-tighter uppercase">{item.title}</h2>
                                <p className="text-white/40 text-sm leading-relaxed font-light">
                                    {item.desc}
                                </p>
                                <div className="pt-6">
                                    <button
                                        onClick={() => setSelectedCollection(item.title)}
                                        className="w-full py-4 rounded-2xl border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-black transition-all"
                                    >
                                        JOIN WAITLIST
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <footer className="mt-32 text-center py-20 border-t border-white/5 animate-fade-in" style={{ animationDelay: '1s' }}>
                <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.8em] text-white/20 font-black">Powered by Invari.Tech</p>
                </div>
            </footer>
        </div>
    );
}
