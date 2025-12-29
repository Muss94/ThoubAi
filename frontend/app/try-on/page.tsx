'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { saveUserMeasurements, saveGeneration, getGenerationData } from '@/app/actions/measurements';
import { createCheckoutSession } from '@/app/actions/checkout';
import { checkGenerationCredits, deductGenerationCredit } from '@/app/actions/credits';
import TopUpModal from '@/components/TopUpModal';

function TryOnContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();

    // States for tailoring
    const [selectedFabric, setSelectedFabric] = useState('White Cotton');
    const [selectedPattern, setSelectedPattern] = useState('Solid');
    const [selectedStyle, setSelectedStyle] = useState('Traditional');
    const [closureType, setClosureType] = useState('buttons');
    const [hasPocket, setHasPocket] = useState(true);

    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [currentMeasurementId, setCurrentMeasurementId] = useState<string | null>(null);
    const [showRevealModal, setShowRevealModal] = useState(true);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

    // Initial state hydration
    useEffect(() => {
        const generationId = searchParams.get('generation_id');

        async function hydrateState() {
            if (generationId) {
                setLoading(true);
                const result = await getGenerationData(generationId);
                if (result.success && result.generation) {
                    const gen = result.generation;
                    setGeneratedImage(gen.imageUrl);
                    setCurrentMeasurementId(gen.measurementId);

                    // Hydrate config
                    if (gen.config) {
                        const cfg = gen.config as any;
                        setSelectedFabric(cfg.fabric || 'White Cotton');
                        setSelectedPattern(cfg.pattern || 'Solid');
                        setSelectedStyle(cfg.style || 'Traditional');
                        setClosureType(cfg.closure || 'buttons');
                        setHasPocket(cfg.pocket !== undefined ? cfg.pocket : true);
                    }

                    // Hydrate measurements if available
                    if (gen.measurement) {
                        setMeasurements({
                            length: gen.measurement.thobeLength.toString(),
                            chest: gen.measurement.chest.toString(),
                            sleeve: gen.measurement.sleeve.toString(),
                            shoulder: gen.measurement.shoulder.toString(),
                        });
                        // Also hide the reveal modal since we are re-visiting
                        setShowRevealModal(false);
                        setIsCustomizing(true);
                    }
                }
                setLoading(false);
            }
        }

        hydrateState();
    }, [searchParams]);

    const handleBack = () => {
        router.push('/capture');
    };

    // Measurements from URL
    // State for measurements (default to URL params, but updatable from generation data)
    const [measurements, setMeasurements] = useState({
        length: searchParams.get('thobe_length') || '0',
        chest: searchParams.get('chest') || '0',
        sleeve: searchParams.get('sleeve') || '0',
        shoulder: searchParams.get('shoulder') || '0',
    });

    const fabrics = [
        { id: "fabric_white", name: "Classic White", color: "#ffffff" },
        { id: "fabric_cream", name: "Desert Cream", color: "#f5f5dc" },
        { id: "fabric_grey", name: "Slate Grey", color: "#708090" },
        { id: "fabric_black", name: "Midnight Black", color: "#000000" },
        { id: "fabric_blue", name: "Royal Blue", color: "#1e3a8a" },
        { id: "fabric_purple", name: "Deep Purple", color: "#581c87" },
    ];

    const patterns = [
        { id: "solid", name: "Solid" },
        { id: "pinstripe", name: "Pinstripe" },
        { id: "checkered", name: "Checkered" },
    ];

    const styles = [
        { id: "saudi_collar", name: "Saudi Collar" },
        { id: "kuwaiti_collar", name: "Kuwaiti Collar" },
        { id: "emirati_collar", name: "Emirati Collar" },
        { id: "round_collar", name: "Round Collar" },
        { id: "official_collar", name: "Official Collar" }
    ];

    const handleDownload = async () => {
        if (!generatedImage) return;
        try {
            const response = await fetch(generatedImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'thoub-ai-bespoke.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleGenerate = async () => {
        // Double check credits before generating
        const creditCheck = await checkGenerationCredits();
        if (!creditCheck.hasCredits) {
            setIsTopUpModalOpen(true);
            return;
        }

        const frontImageId = searchParams.get('front_image_id'); // Still needed for measurements
        const profileImageId = searchParams.get('profile_image_id'); // New ID for AI generation
        const heightCm = parseFloat(searchParams.get('height_cm') || '170');

        if (!profileImageId) {
            alert("No profile image found. Please go back to Capture.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("profile_image_id", profileImageId);
        formData.append("texture_id", selectedFabric);
        formData.append("pattern_id", selectedPattern);
        formData.append("style_config", selectedStyle);
        formData.append("closure_type", closureType);
        formData.append("has_pocket", hasPocket.toString());
        formData.append("extra_details", "");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/try-on`, {
                method: 'POST',
                headers: {
                    'X-Thoub-API-Key': process.env.NEXT_PUBLIC_THOUB_API_KEY || ''
                },
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Generation failed");
            }

            const data = await res.json();

            if (data.image_url) {
                setGeneratedImage(data.image_url);

                // Deduct credit
                await deductGenerationCredit();

                // Auto-save to Supabase if authenticated
                if (session?.user && frontImageId) {
                    setIsSyncing(true);

                    const measResult = await saveUserMeasurements({
                        userId: session.user.email!, // Email used as makeshift ID or look up user
                        userEmail: session.user.email!,
                        heightCm,
                        frontImageId,
                        sideImageId: searchParams.get('side_image_id') || undefined,
                        profileImageId,
                        measurements: {
                            thobeLength: parseFloat(searchParams.get('thobe_length') || '0'),
                            chest: parseFloat(searchParams.get('chest') || '0'),
                            sleeve: parseFloat(searchParams.get('sleeve') || '0'),
                            shoulder: parseFloat(searchParams.get('shoulder') || '0'),
                        }
                    });

                    if (measResult.success && measResult.measurementId) {
                        setCurrentMeasurementId(measResult.measurementId);
                        // Save generation
                        await saveGeneration({
                            measurementId: measResult.measurementId,
                            imageUrl: data.image_url,
                            config: {
                                fabric: selectedFabric,
                                pattern: selectedPattern,
                                style: selectedStyle,
                                closure: closureType,
                                pocket: hasPocket
                            }
                        });
                    }
                    setIsSyncing(false);
                }
            }

        } catch (error: any) {
            console.error('Try-on error:', error);
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const fullUrl = `${backendUrl}/try-on`;
            const errorMessage = `Generation failed: ${error.message || 'Unknown error'}. 
            Backend URL: ${backendUrl}
            Attempted to fetch: ${fullUrl}`;

            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!generatedImage || !session?.user || !currentMeasurementId) return;

        setIsCheckingOut(true);
        try {
            const result = await createCheckoutSession({
                measurementId: currentMeasurementId,
                config: {
                    fabric: selectedFabric,
                    pattern: selectedPattern,
                    style: selectedStyle,
                    closure: closureType,
                    pocket: hasPocket
                }
            });

            if (result?.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error('Checkout failed:', error);
            alert('Checkout failed. Please try again.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const frontImageId = searchParams.get('front_image_id');
    const sideImageId = searchParams.get('side_image_id');

    // Auto-generate on first load if we have specific params or logic? 
    // Usually we wait for user, but here we might want to auto-trigger if customizing?
    // For now, manual trigger via "Visualize" or effects is better. 
    // Actually, update effect to trigger generation if certain conditions met? 
    // The previous code had a trigger on fabric change... let's add that back.

    // Auto-generation effects removed to enforce manual "Confirm Selection" trigger


    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#080808] text-foreground pt-20">
            <TopUpModal
                isOpen={isTopUpModalOpen}
                onClose={() => setIsTopUpModalOpen(false)}
                type="generation"
            />
            {showRevealModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-fade-in">
                    <div className="max-w-2xl w-full">
                        <div className="text-center mb-12">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-4">Precision Analysis Complete</h2>
                            <h1 className="text-5xl font-black text-white tracking-tighter mb-4 uppercase">Your Biometric Profile</h1>
                            <p className="text-white/40 text-sm italic">"A digital blueprint of your unique physique, ready for the artisan's touch."</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.1">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 2v20M2 12h20" />
                                </svg>
                            </div>

                            <div className="grid grid-cols-2 gap-8 relative z-10">
                                {[
                                    { label: "Thobe Length", value: measurements.length, desc: "Shoulder to Ankle" },
                                    { label: "Chest Circumference", value: measurements.chest, desc: "Full Volumetric Span" },
                                    { label: "Sleeve Length", value: measurements.sleeve, desc: "Shoulder to Wrist" },
                                    { label: "Shoulder Width", value: measurements.shoulder, desc: "Acromion to Acromion" }
                                ].map((m, i) => (
                                    <div key={m.label} className="space-y-2 translate-y-4 opacity-0 animate-reveal" style={{ animationDelay: `${i * 0.15 + 0.5}s` }}>
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-black">{m.label}</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-mono font-black gold-gradient-text italic leading-tight">{m.value}</span>
                                            <span className="text-sm opacity-30 font-bold uppercase">cm</span>
                                        </div>
                                        <p className="text-[9px] text-white/30 uppercase tracking-widest">{m.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    setShowRevealModal(false);
                                    setIsCustomizing(true);
                                }}
                                className="w-full mt-12 btn-primary py-6 rounded-2xl text-lg font-black tracking-widest transition-all hover:scale-[1.02]"
                            >
                                CUSTOMISE YOUR THOUB
                            </button>
                        </div>

                        <p className="text-center mt-8 text-[9px] text-white/20 uppercase tracking-[0.4em]">Proprietary Computer Vision Engine v2.4</p>
                    </div>
                </div>
            )}

            {/* Sidebar Controls */}
            <div className={`w-full md:w-1/3 p-6 border-r border-white/10 flex flex-col gap-6 bg-[#0a0a0a] overflow-y-auto transition-all duration-700 ${!isCustomizing ? 'grayscale opacity-50 blur-sm pointer-events-none' : ''}`}>
                <header className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        title="Back to Measurements"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter gold-gradient-text leading-none">THOUB AI</h1>
                        <p className="text-[10px] tracking-[0.4em] uppercase text-primary/60 mt-2 font-bold">The Digital Atelier</p>
                    </div>
                </header>

                {/* Biometric Data Mini-Panel (Sticky/Condensed) */}
                <div className="bg-primary/5 p-4 rounded-3xl border border-primary/20 space-y-3 relative overflow-hidden backdrop-blur-sm">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-primary italic">Verified Profile</h3>
                        <span className="text-[8px] opacity-30 font-mono italic">#{frontImageId?.slice(-6) || "---"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/40 rounded-xl p-3 border border-white/5 group hover:border-primary/30 transition-colors">
                            <span className="text-[8px] uppercase text-primary font-black tracking-wider block mb-1">Length</span>
                            <span className="text-sm font-mono text-white group-hover:text-primary transition-colors">{measurements.length}cm</span>
                        </div>
                        <div className="bg-black/40 rounded-xl p-3 border border-white/5 group hover:border-primary/30 transition-colors">
                            <span className="text-[8px] uppercase text-primary font-black tracking-wider block mb-1">Chest</span>
                            <span className="text-sm font-mono text-white group-hover:text-primary transition-colors">{measurements.chest}cm</span>
                        </div>
                        <div className="bg-black/40 rounded-xl p-3 border border-white/5 group hover:border-primary/30 transition-colors">
                            <span className="text-[8px] uppercase text-primary font-black tracking-wider block mb-1">Sleeve</span>
                            <span className="text-sm font-mono text-white group-hover:text-primary transition-colors">{measurements.sleeve}cm</span>
                        </div>
                        <div className="bg-black/40 rounded-xl p-3 border border-white/5 group hover:border-primary/30 transition-colors">
                            <span className="text-[8px] uppercase text-primary font-black tracking-wider block mb-1">Shoulder</span>
                            <span className="text-sm font-mono text-white group-hover:text-primary transition-colors">{measurements.shoulder}cm</span>
                        </div>
                    </div>
                </div>

                {/* Customization Options */}
                <div className="space-y-8 pb-10">
                    {/* Fabric Selection */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Fabric Collection</h3>
                        <div className="grid grid-cols-5 gap-3">
                            {fabrics.map(fabric => (
                                <button
                                    key={fabric.id}
                                    onClick={() => setSelectedFabric(fabric.id)}
                                    className={`aspect-square rounded-full relative group transition-all duration-300 ${selectedFabric === fabric.id ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-black' : 'hover:scale-110'}`}
                                >
                                    <div className="absolute inset-0 rounded-full" style={{ backgroundColor: fabric.color }} />
                                    {selectedFabric === fabric.id && (
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-primary">{fabric.name}</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Style Selection */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Collar Silhouette</h3>
                        <div className="flex flex-col gap-2">
                            {styles.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style.id)}
                                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${selectedStyle === style.id ? 'bg-white/10 border-primary/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                >
                                    <div className="flex justify-between items-center relative z-10">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${selectedStyle === style.id ? 'text-white' : 'text-white/60'}`}>{style.name}</span>
                                        {selectedStyle === style.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(212,175,55,1)]" />}
                                    </div>
                                    {selectedStyle === style.id && <div className="absolute inset-0 bg-primary/5 animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Construction Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <span className="text-[9px] uppercase text-white/40 block mb-3">Closure System</span>
                                <div className="flex bg-black/50 p-1 rounded-xl">
                                    <button
                                        onClick={() => setClosureType('buttons')}
                                        className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${closureType === 'buttons' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Btn
                                    </button>
                                    <button
                                        onClick={() => setClosureType('zip')}
                                        className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${closureType === 'zip' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Zip
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <span className="text-[9px] uppercase text-white/40 block mb-3">Chest Pocket</span>
                                <button
                                    onClick={() => setHasPocket(!hasPocket)}
                                    className={`w-full py-3 rounded-xl border transition-all text-[9px] font-bold uppercase tracking-wider ${hasPocket ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/10 text-white/30'}`}
                                >
                                    {hasPocket ? 'Active ●' : 'None ○'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pattern */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Weave Pattern</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {patterns.map(pattern => (
                                <button
                                    key={pattern.id}
                                    onClick={() => setSelectedPattern(pattern.id)}
                                    className={`py-3 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${selectedPattern === pattern.id ? 'border-primary/50 text-white bg-white/5' : 'border-white/5 text-white/40 hover:bg-white/5'}`}
                                >
                                    {pattern.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Manual Generation Trigger */}
                    <div className="pt-6 border-t border-white/10">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !isCustomizing}
                            className="w-full btn-primary py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    <span>Weaving...</span>
                                </>
                            ) : (
                                <>
                                    <span>Confirm Selection</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Preview Area - 3 Column / Multi-Card View */}
            <div className={`flex-1 p-8 lg:p-12 bg-black relative overflow-hidden flex flex-col transition-all duration-1000 ${!isCustomizing ? 'grayscale blur-xl opacity-20' : 'opacity-100'}`}>
                {/* Background Decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] mix-blend-screen" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] mix-blend-screen" />
                </div>

                {/* Header Section - Improved spacing */}
                <div className="relative z-10 mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Visual Synthesis</span>
                            <h2 className="text-3xl font-black text-white/95 tracking-tighter uppercase italic">The Digital Loom</h2>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">Real-time Status</span>
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(212,175,55,1)] ${isSyncing ? 'bg-blue-400' : 'bg-primary'}`} />
                                {loading ? "Weft & Warp Alignment..." : (isSyncing ? "Syncing Biometrics..." : (generatedImage ? "Masterpiece Secured" : "Atelier Prime"))}
                            </span>
                            {session && !loading && !isSyncing && generatedImage && (
                                <span className="text-[8px] text-primary/40 uppercase tracking-widest font-black mt-1 animate-fade-in">
                                    Profile Synced to Supabase
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10 flex-1">
                    {/* Center: The AI Result (Expanded) */}
                    <div className="lg:col-span-8 flex flex-col">
                        <div className="relative w-full flex-1 glass rounded-[4rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,1)] border border-white/10 flex items-center justify-center group/result min-h-[650px] bg-black">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                            {!generatedImage || loading ? (
                                <div className="text-center flex flex-col items-center p-0 relative w-full h-full justify-center">
                                    {loading ? (
                                        <>
                                            {/* Scanning Effect Overlay */}
                                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                                                <div className="w-full h-1 bg-primary/50 shadow-[0_0_20px_rgba(212,175,55,0.8)] animate-scan-vertical absolute top-0" />
                                                <div className="space-y-4 max-w-lg mx-auto text-center relative z-30 bg-black/60 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
                                                    <h2 className="text-4xl font-black gold-gradient-text tracking-tighter uppercase italic animate-pulse">Synthesizing</h2>
                                                    <p className="text-white text-[10px] uppercase tracking-[0.4em] leading-loose font-bold">{loading ? "Weaving bespoke silhouette..." : ""}</p>
                                                </div>
                                            </div>

                                            {/* Source Image */}
                                            <img
                                                src="/images/measurement-loading.jpg"
                                                alt="Source Profile"
                                                className="w-full h-full object-cover opacity-60"
                                            />
                                        </>
                                    ) : (
                                        <div className="animate-fade-in space-y-12 p-12">
                                            <div className="w-48 h-48 mx-auto rounded-full border-[1.5px] border-primary/30 flex items-center justify-center relative overflow-hidden group/loader">
                                                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                                <div className="absolute inset-0 border-t-[3px] border-primary rounded-full animate-spin opacity-60" />
                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary relative z-10 drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]">
                                                    <path d="M12 2v20M2 12h20" />
                                                    <circle cx="12" cy="12" r="8" strokeWidth="0.5" />
                                                </svg>
                                            </div>
                                            <div className="space-y-8">
                                                <div className="space-y-3">
                                                    <h2 className="text-6xl font-black gold-gradient-text tracking-tighter uppercase italic">The Mirror</h2>
                                                    <div className="h-[2px] w-32 bg-primary/40 mx-auto" />
                                                </div>
                                                <div className="space-y-4 max-w-lg mx-auto">
                                                    <p className="text-white text-[11px] uppercase tracking-[0.6em] leading-loose font-black italic opacity-90 transition-all duration-1000">
                                                        The digital loom awaits your command. Select your preferred collar architecture and textile weight to begin.
                                                    </p>
                                                    <div className="flex justify-center gap-2 opacity-40">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <img
                                        src={generatedImage}
                                        alt="Try On Result"
                                        className="w-full h-full object-contain p-8 animate-fade-in transition-transform duration-[3000ms] group-hover/result:scale-[1.02]"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-[1px]">
                                        <div className="flex flex-row justify-between items-end gap-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-[2px] bg-primary shadow-[0_0_15px_rgba(212,175,55,1)]" />
                                                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.7em] italic">Atelier Synced</p>
                                                </div>
                                                <p className="text-white/95 text-xl font-light leading-snug italic line-clamp-2 font-serif">
                                                    "An exquisite {selectedStyle.replace('_collar', '')} silhouette tailored in {fabrics.find(f => f.id === selectedFabric)?.name}."
                                                </p>
                                            </div>

                                            <div className="flex gap-3 shrink-0">
                                                <button
                                                    onClick={handleDownload}
                                                    className="bg-white/5 border border-white/10 text-white/60 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 group/dl"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/dl:translate-y-0.5 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                    Export
                                                </button>
                                                <button
                                                    onClick={handleCheckout}
                                                    disabled={isCheckingOut}
                                                    className="bg-primary text-black px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center gap-2 group/checkout disabled:opacity-50 disabled:grayscale"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/checkout:translate-x-0.5 transition-transform"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                                                    {isCheckingOut ? "Securing..." : "Secure Order"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: Selected Choices Preview */}
                    <div className="lg:col-span-4 h-full">
                        <div className="bg-white/5 border border-white/10 rounded-[3.5rem] p-10 space-y-12 backdrop-blur-3xl shadow-3xl h-full relative overflow-hidden group/choices animate-reveal flex flex-col" style={{ animationDelay: '0.8s' }}>
                            <div className="absolute bottom-[-50px] right-[-50px] p-20 opacity-[0.05] transition-transform duration-[3000ms] group-hover/choices:scale-110 group-hover/choices:rotate-12">
                                <svg width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.2">
                                    <path d="M12 2v20M2 12h20" />
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                </svg>
                            </div>

                            <div className="space-y-12 relative z-10 flex-1">
                                <div className="space-y-3">
                                    <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-white italic">Atelier Blueprint</h3>
                                    <div className="w-8 h-[2px] bg-primary" />
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2 block">Selected Textile</span>
                                        <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">{fabrics.find(f => f.id === selectedFabric)?.name}</h4>
                                        <ul className="space-y-1">
                                            <li className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/40">
                                                <span className="w-1 h-1 rounded-full bg-primary" />
                                                Premium Grade Fabric
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2 block">Collar Silhouette</span>
                                        <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">{styles.find(s => s.id === selectedStyle)?.name}</h4>
                                        <ul className="space-y-1">
                                            <li className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/40">
                                                <span className="w-1 h-1 rounded-full bg-primary" />
                                                Bespoke Architecture
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2 block">Closure System</span>
                                        <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">{closureType}</h4>
                                        <ul className="space-y-1">
                                            <li className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/40">
                                                <span className="w-1 h-1 rounded-full bg-primary" />
                                                Artisan Fastening
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TryOnPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Atelier...</div>}>
            <TryOnContent />
        </Suspense>
    );
}
