'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateMeasurementProfileImage } from '@/app/actions/measurements';

interface ProfileImageUploaderProps {
    measurementId: string;
    existingImageId?: string | null;
}

export default function ProfileImageUploader({ measurementId, existingImageId }: ProfileImageUploaderProps) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);

    // If we have an existing image ID, it's served from our backend uploads directory
    const imageUrl = existingImageId
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/${existingImageId}`
        : null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        try {
            // 1. Upload to Backend
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload-image`, {
                method: 'POST',
                headers: {
                    'X-Thoub-API-Key': process.env.NEXT_PUBLIC_THOUB_API_KEY || ''
                },
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();

            if (data.success && data.filename) {
                // 2. Update Measurement Record
                const updateRes = await updateMeasurementProfileImage(measurementId, data.filename);

                if (updateRes.success) {
                    router.refresh(); // Refresh to show new image
                } else {
                    alert('Failed to update profile');
                }
            }
        } catch (error) {
            console.error(error);
            alert('Error uploading image');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative group w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black/40 border border-white/10">
            {imageUrl ? (
                <>
                    <img
                        src={imageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-white/20 transition-all">
                            Change Photo
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*,.heic"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-white/60 font-medium uppercase tracking-wider mb-2">No Profile Photo</p>
                        <label className={`cursor-pointer btn-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*,.heic"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                </div>
            )}

            {uploading && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            )}
        </div>
    );
}
