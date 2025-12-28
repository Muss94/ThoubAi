import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
// Triggering rebuild to sync Prisma Client
import { redirect } from "next/navigation";
import ProfileImageUploader from "@/components/ProfileImageUploader";
import DeleteGenerationButton from "@/components/DeleteGenerationButton";
import CreditStatus from "@/components/CreditStatus";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/signin");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            measurements: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            generations: {
                orderBy: { createdAt: 'desc' },
                include: {
                    measurement: true
                }
            },
            orders: {
                orderBy: { createdAt: 'desc' },
                include: {
                    measurement: true
                }
            }
        }
    });

    const latestMeasurement = user?.measurements[0];
    const generations = user?.generations || [];
    const orders = user?.orders || [];

    return (
        <div className="min-h-screen bg-black text-white p-6 pt-32 font-sans overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-black to-black">
            <div className="max-w-7xl mx-auto space-y-20">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-reveal">
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Artisan Profiling</span>
                        <h1 className="text-6xl font-black tracking-tighter uppercase italic gold-gradient-text">Welcome, {session.user.name?.split(' ')[0]}</h1>
                        <p className="text-white/40 text-sm tracking-widest uppercase max-w-xl leading-relaxed">
                            Access your precision biometric data, your bespoke catalogue, and track the craftsmanship of your orders.
                        </p>
                    </div>

                    {/* Credits Status Component */}
                    <div className="min-w-[320px]">
                        <CreditStatus
                            measurementCredits={user?.measurementCredits ?? 0}
                            generationCredits={user?.generationCredits ?? 0}
                        />
                    </div>
                </header>
                <Link
                    href="/capture"
                    className="btn-primary px-10 py-5 rounded-2xl text-[11px] font-black tracking-widest uppercase hover:scale-105 transition-transform w-full md:w-auto text-center"
                >
                    New Measurement
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: Biometrics Card */}
                    <div className="lg:col-span-4 space-y-8 animate-reveal" style={{ animationDelay: '0.2s' }}>
                        <div className="bg-surface/30 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 space-y-10 relative overflow-hidden group">
                            <div className="absolute top-[-50px] right-[-50px] p-20 opacity-[0.03]">
                                <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 2v20M2 12h20" />
                                </svg>
                            </div>

                            <div className="space-y-2 relative z-10">
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Latest Profile</h2>
                                <div className="h-[2px] w-12 bg-primary" />
                            </div>

                            {latestMeasurement ? (
                                <div className="grid grid-cols-2 gap-8 relative z-10">
                                    {[
                                        { label: "Length", value: latestMeasurement.thobeLength },
                                        { label: "Chest", value: latestMeasurement.chest },
                                        { label: "Sleeve", value: latestMeasurement.sleeve },
                                        { label: "Shoulder", value: latestMeasurement.shoulder },
                                    ].map((m) => (
                                        <div key={m.label} className="space-y-1">
                                            <span className="text-[10px] uppercase tracking-widest text-primary/60 font-black">{m.label}</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-mono font-black text-white italic">{Math.round(m.value)}</span>
                                                <span className="text-[10px] opacity-30 font-bold uppercase">cm</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Profile Image Section */}
                                    <div className="col-span-2 mt-4 pt-4 border-t border-white/5">
                                        <span className="text-[10px] uppercase tracking-widest text-primary/60 font-black mb-4 block">Biometric Scan</span>
                                        <ProfileImageUploader
                                            measurementId={latestMeasurement.id}
                                            existingImageId={latestMeasurement.profileImageId}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center relative z-10">
                                    <p className="text-white/20 text-xs uppercase tracking-widest italic">No measurements captured yet.</p>
                                </div>
                            )}

                            <div className="pt-8 border-t border-white/5 relative z-10">
                                <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 leading-relaxed italic" suppressHydrationWarning>
                                    Verified by Neural Precision <br />
                                    Last Updated: {latestMeasurement ? new Date(latestMeasurement.createdAt).toLocaleDateString() : '---'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: My Catalogue */}
                    <div className="lg:col-span-8 space-y-8 animate-reveal" style={{ animationDelay: '0.4s' }}>
                        <div className="flex items-center justify-between px-2">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">My Catalogue</h2>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black">AI Powered Generations</p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="flex overflow-x-auto pb-8 gap-6 no-scrollbar snap-x snap-mandatory">
                                {generations.length > 0 ? (
                                    generations.map((gen) => (
                                        <div key={gen.id} className="flex-none w-64 snap-start group animate-fade-in translate-y-4 hover:translate-y-0 transition-transform">
                                            <div className="relative aspect-[2/3] rounded-3xl overflow-hidden border border-white/10 group-hover:border-primary/40 transition-colors bg-white/5">
                                                <DeleteGenerationButton generationId={gen.id} />
                                                <img
                                                    src={gen.imageUrl}
                                                    alt="Bespoke Generation"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                                    <span className="text-[8px] uppercase tracking-widest text-primary font-black mb-1">{(gen.config as any).style || 'Traditional'}</span>
                                                    <p className="text-[10px] text-white/60 font-medium line-clamp-2">{(gen.config as any).fabric} with {(gen.config as any).pattern}</p>
                                                    <Link
                                                        href={`/try-on?generation_id=${gen.id}`}
                                                        className="mt-4 bg-primary text-black text-center py-2 rounded-xl text-[9px] font-black uppercase tracking-widest"
                                                    >
                                                        Re-customize
                                                    </Link>
                                                </div>
                                            </div>
                                            <p className="mt-4 text-[9px] uppercase tracking-widest text-white/30 font-bold text-center" suppressHydrationWarning>
                                                {new Date(gen.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full h-48 border border-white/5 border-dashed rounded-3xl flex flex-col items-center justify-center space-y-3 opacity-20">
                                        <p className="text-[10px] uppercase tracking-[0.3em] italic">Your AI Atelier is empty.</p>
                                        <Link href="/capture" className="text-[9px] font-black border-b border-primary text-primary">Capture Now</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom: Orders History */}
                <div className="space-y-12 animate-reveal" style={{ animationDelay: '0.6s' }}>
                    <div className="flex items-center justify-between px-2">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Bespoke History</h2>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black">Craftsmanship Tracking</p>
                        </div>
                        <span className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-[10px] font-black tracking-widest uppercase">
                            {orders.length} Orders
                        </span>
                    </div>

                    <div className="space-y-4">
                        {orders.length > 0 ? (
                            orders.map((order) => (
                                <div key={order.id} className="bg-surface/20 hover:bg-surface/30 transition-all border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/40 transition-colors">
                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-black tracking-tight uppercase">Thoub Config: {(order.config as any).style || 'Standard'}</span>
                                                <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${order.status === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-primary/20 text-primary'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono" suppressHydrationWarning>ID: {order.id.slice(0, 12)}... • {new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <p className="text-[9px] uppercase tracking-widest text-white/20 font-black mb-1">Total Amount</p>
                                            <p className="text-xl font-mono font-black gold-gradient-text">${(order.total / 100).toFixed(2)}</p>
                                        </div>
                                        <button className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                            Details
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 bg-surface/10 rounded-[3rem] border border-white/5 border-dashed flex flex-col items-center justify-center space-y-6">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center opacity-20">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                        <line x1="8" y1="21" x2="16" y2="21" />
                                        <line x1="12" y1="17" x2="12" y2="21" />
                                    </svg>
                                </div>
                                <p className="text-white/20 text-xs uppercase tracking-[0.4em] font-black italic">Awaiting your first commission.</p>
                                <Link href="/catalogue" className="text-primary text-[10px] uppercase tracking-widest font-black hover:underline">Browse the Collection →</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
