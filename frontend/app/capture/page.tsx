'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { checkMeasurementCredits, deductMeasurementCredit } from '@/app/actions/credits';
import { saveUserMeasurements, updateUserProfileImage } from '@/app/actions/measurements';
import TopUpModal from '@/components/TopUpModal';

// Instruction Modal Component
function InstructionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="bg-surface border border-white/10 rounded-[2.5rem] p-8 max-w-lg w-full relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div className="text-center mb-10">
                    <h2 className="text-2xl font-black gold-gradient-text tracking-tight mb-2">PRECISION CHECK</h2>
                    <p className="text-sm text-white/50">To ensure an exact fit, please follow the stance guide below.</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="space-y-4">
                        <div className="aspect-[3/4] bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
                            {/* Abstract T-Pose SVG */}
                            <svg viewBox="0 0 100 200" className="h-32 opacity-80 stroke-primary stroke-[1.5] fill-none">
                                <circle cx="50" cy="30" r="12" />
                                <path d="M50 42 v60 m-35 -50 h70 m-15 50 v80 m-20 -80 v80" strokeLinecap="round" />
                                <path d="M10 10 h80 v180 h-80 z" className="stroke-white/10 stroke-1" strokeDasharray="4 4" />
                            </svg>
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-white/90">T-Pose (Front)</h3>
                            <p className="text-[10px] text-white/40 mt-1 leading-relaxed">Arms slightly away from body. Feet shoulder-width apart.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="aspect-[3/4] bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
                            {/* Abstract Side-Pose SVG */}
                            <svg viewBox="0 0 100 200" className="h-32 opacity-80 stroke-primary stroke-[1.5] fill-none">
                                <circle cx="50" cy="30" r="12" />
                                <path d="M50 42 v60 m0 -50 l15 25 m-15 25 v80 m5 -80 v80" strokeLinecap="round" />
                                <path d="M10 10 h80 v180 h-80 z" className="stroke-white/10 stroke-1" strokeDasharray="4 4" />
                            </svg>
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-white/90">Side Profile</h3>
                            <p className="text-[10px] text-white/40 mt-1 leading-relaxed">Stand straight. Arms visibly separated from torso.</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full btn-primary py-4 rounded-xl text-sm font-bold tracking-wider"
                >
                    ACKNOWLEDGE
                </button>
            </div>
        </div>
    );
}

export default function CapturePage() {
    const [frontImage, setFrontImage] = useState<File | null>(null);
    const [sideImage, setSideImage] = useState<File | null>(null);
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [heightCm, setHeightCm] = useState<number>(180);
    const [processing, setProcessing] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false); // Modal state
    const [hasCredits, setHasCredits] = useState(true);
    const [creditsRemaining, setCreditsRemaining] = useState(0);
    const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    // Auto-show instructions on mount
    React.useEffect(() => {
        setShowInstructions(true);
    }, []);

    // Check credits on mount
    React.useEffect(() => {
        async function checkCredits() {
            const result = await checkMeasurementCredits();
            if (result.success) {
                setHasCredits(result.hasCredits);
                setCreditsRemaining(result.credits || 0);
            }
        }
        checkCredits();
    }, []);

    const handleUpload = async () => {
        if (!frontImage) {
            alert("Please upload at least the front image.");
            return;
        }

        if (!profileImage) {
            alert("Please upload your profile picture for AI generation.");
            return;
        }

        // Check if user has measurement credits
        if (!hasCredits) {
            setIsTopUpModalOpen(true);
            return;
        }

        setProcessing(true);
        const formData = new FormData();
        formData.append("front_image", frontImage);
        if (sideImage) formData.append("side_image", sideImage);
        formData.append("profile_image", profileImage);
        formData.append("height_cm", heightCm.toString());
        formData.append("fit_type", "Standard");

        try {
            // Start the API call and a 2-second timer simultaneously
            const apiPromise = fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/measure`, {
                method: 'POST',
                headers: {
                    'X-Thoub-API-Key': process.env.NEXT_PUBLIC_THOUB_API_KEY || ''
                },
                body: formData,
            });
            const delayPromise = new Promise(resolve => setTimeout(resolve, 2000));

            // Wait for both to complete
            const [res] = await Promise.all([apiPromise, delayPromise]);

            if (!res.ok) {
                const err = await res.json();
                console.error("Fetch error details:", err);
                throw new Error(err.detail || "Measurement failed");
            }

            const data = await res.json();
            console.log("Measurement success:", data);

            // 1. SAVE TO DATABASE IMMEDIATELY
            let savedMeasurementId = "";
            if (session?.user?.email) {
                const saveResult = await saveUserMeasurements({
                    userId: session.user.id || "",
                    userEmail: session.user.email,
                    heightCm: heightCm,
                    frontImageId: data.image_ids.front_url || data.image_ids.front,
                    sideImageId: data.image_ids.side_url || data.image_ids.side || undefined,
                    profileImageId: data.image_ids.profile_url || data.image_ids.profile,
                    measurements: {
                        thobeLength: data.measurements.thobe_length,
                        chest: data.measurements.chest_circumference,
                        sleeve: data.measurements.sleeve_length,
                        shoulder: data.measurements.shoulder_width,
                    }
                });

                if (saveResult.success && saveResult.measurementId) {
                    savedMeasurementId = saveResult.measurementId;
                }

                // 2. SYNC PROFILE IMAGE TO ACCOUNT
                if (data.image_ids.profile_url) {
                    await updateUserProfileImage(data.image_ids.profile_url);
                }
            }

            // Deduct measurement credit after successful measurement
            const deductResult = await deductMeasurementCredit();
            if (deductResult.success) {
                setCreditsRemaining(deductResult.remainingCredits || 0);
                setHasCredits((deductResult.remainingCredits || 0) > 0);
            }

            const query = new URLSearchParams({
                thobe_length: data.measurements.thobe_length.toString(),
                chest: data.measurements.chest_circumference.toString(),
                sleeve: data.measurements.sleeve_length.toString(),
                shoulder: data.measurements.shoulder_width.toString(),
                height_cm: heightCm.toString(),
                front_image_id: data.image_ids.front,
                side_image_id: data.image_ids.side || "",
                profile_image_id: data.image_ids.profile,
                measurement_id: savedMeasurementId // Pass the DB anchor
            }).toString();

            router.push(`/try-on?${query}`);

        } catch (error: any) {
            console.error('Process error:', error);
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const fullUrl = `${backendUrl}/measure`;
            const errorMessage = `Failed to process: ${error.message || 'Unknown error'}. 
            Backend URL: ${backendUrl}
            Attempted to fetch: ${fullUrl}`;

            alert(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 pt-32 font-sans overflow-y-auto">
            <InstructionModal isOpen={showInstructions} onClose={() => setShowInstructions(false)} />
            <TopUpModal
                isOpen={isTopUpModalOpen}
                onClose={() => setIsTopUpModalOpen(false)}
                type="measurement"
            />

            {/* Navigation / Logo */}
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-12 animate-fade-in">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black tracking-tighter gold-gradient-text">THOUB AI</h1>
                    <span className="text-[10px] tracking-[0.4em] uppercase text-primary/60 -mt-1 ml-1">The Digital Atelier</span>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowInstructions(true)}
                        className="text-[10px] uppercase tracking-widest text-primary hover:text-white transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        View Guide
                    </button>
                    <div className="text-[10px] uppercase tracking-widest text-white/30 text-right hidden sm:block border-l border-white/10 pl-6">
                        Step 01 <br /> Capture Dimensions
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto glass p-1 rounded-[2rem] shadow-2xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="bg-surface/50 backdrop-blur-3xl rounded-[1.9rem] p-8 md:p-12 relative overflow-hidden">

                    {/* Subtle Scanning background decoration */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-sm" />

                    {processing && (
                        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-fade-in">
                            <div className="relative w-72 h-[28rem] md:w-96 md:h-[38rem] border border-primary/20 rounded-[2rem] overflow-hidden mb-10 flex items-center justify-center shadow-[0_0_100px_rgba(var(--primary-rgb),0.2)]">
                                {/* Weaving Motion Animation */}
                                <div className="absolute inset-0 opacity-40">
                                    {[...Array(8)].map((_, i) => (
                                        <div
                                            key={`h-${i}`}
                                            className="animate-weave-h"
                                            style={{ top: `${(i + 1) * 12}%`, animationDelay: `${i * 0.2}s` }}
                                        />
                                    ))}
                                    {[...Array(8)].map((_, i) => (
                                        <div
                                            key={`v-${i}`}
                                            className="animate-weave-v"
                                            style={{ left: `${(i + 1) * 12}%`, animationDelay: `${i * 0.2}s` }}
                                        />
                                    ))}
                                </div>
                                <div className="animate-scan" />
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-primary/5 z-10" />
                                <img
                                    src="/measurement_model.jpg"
                                    alt="Measurement Model"
                                    className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity grayscale scale-110"
                                />
                                <div className="absolute inset-0 bg-primary/5 mix-blend-overlay z-10" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-3xl md:text-4xl font-black tracking-[0.4em] text-primary animate-gold-glow mb-4">WEAVING NEURAL MESH</h2>
                                <p className="text-white/40 text-[10px] md:text-xs uppercase tracking-[0.3em]">Analyzing 256 volumetric intersection points in real-time</p>
                            </div>
                        </div>
                    )}

                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-light mb-2">Neural Measurement</h2>
                        <p className="text-white/40 text-sm max-w-md mx-auto">Upload your silhouettes in the T-Pose and Side-Pose for precise volumetric calculation.</p>
                    </div>

                    <div className="space-y-12">
                        {/* Height Input */}
                        <div className="flex flex-col items-center">
                            <label className="text-xs uppercase tracking-[0.3em] text-primary/80 mb-4">True Height (cm)</label>
                            <input
                                type="number"
                                value={heightCm}
                                onChange={(e) => setHeightCm(parseInt(e.target.value))}
                                className="bg-white/5 border border-white/10 text-center text-5xl font-black py-4 px-8 rounded-2xl focus:outline-none focus:border-primary/50 transition-colors w-48 text-white tabular-nums"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {/* Front Photo */}
                            <div className="space-y-6">
                                <h3 className="text-center text-xs uppercase tracking-[0.2em] opacity-60">Front Profile (T-Pose)</h3>
                                <label className="group relative cursor-pointer block">
                                    <div className="aspect-[3/4] rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center transition-all group-hover:bg-white/10 group-hover:border-primary/30 overflow-hidden">
                                        {frontImage ? (
                                            <img src={URL.createObjectURL(frontImage)} className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                                </div>
                                                <p className="text-xs text-white/40 px-6 text-center">Tap to Upload <br /> FRONT VIEW</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*,.heic,.heif" onChange={(e) => setFrontImage(e.target.files?.[0] || null)} />
                                </label>
                            </div>

                            {/* Profile Picture - NEW */}
                            <div className="space-y-6">
                                <h3 className="text-center text-xs uppercase tracking-[0.2em] opacity-60">Profile Picture</h3>
                                <label className="group relative cursor-pointer block">
                                    <div className="aspect-[3/4] rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center transition-all group-hover:bg-primary/10 group-hover:border-primary/50 overflow-hidden">
                                        {profileImage ? (
                                            <img src={URL.createObjectURL(profileImage)} className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 group-hover:scale-110 transition-transform">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                </div>
                                                <p className="text-xs text-primary/60 px-6 text-center font-bold">Tap to Upload <br /> CLOSE-UP PORTRAIT</p>
                                                <p className="text-[9px] text-white/30 px-6 text-center mt-2">For AI Generation</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*,.heic,.heif" onChange={(e) => setProfileImage(e.target.files?.[0] || null)} />
                                </label>
                            </div>

                            {/* Side Photo */}
                            <div className="space-y-6">
                                <h3 className="text-center text-xs uppercase tracking-[0.2em] opacity-60">Side Profile (A-Pose)</h3>
                                <label className="group relative cursor-pointer block">
                                    <div className="aspect-[3/4] rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center transition-all group-hover:bg-white/10 group-hover:border-primary/30 overflow-hidden">
                                        {sideImage ? (
                                            <img src={URL.createObjectURL(sideImage)} className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                                </div>
                                                <p className="text-xs text-white/40 px-6 text-center">Tap to Upload <br /> SIDE VIEW</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*,.heic,.heif" onChange={(e) => setSideImage(e.target.files?.[0] || null)} />
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={!frontImage || processing}
                            className="w-full btn-primary py-6 rounded-2xl text-lg disabled:opacity-30 disabled:grayscale transition-all"
                        >
                            {processing ? "PROCESSING SILHOUETTE..." : "CALCULATE MEASUREMENTS"}
                        </button>
                    </div>
                </div>
            </div>

            <footer className="mt-8 text-center text-white/20 text-[10px] tracking-widest uppercase animate-fade-in" style={{ animationDelay: '1s' }}>
                Encryption Secured • GDPR Compliant • Proprietary AI
            </footer>
        </div>
    );
}
