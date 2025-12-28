'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteGeneration } from '@/app/actions/measurements';

export default function DeleteGenerationButton({ generationId }: { generationId: string }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to remove this design from your catalogue?')) return;

        setIsDeleting(true);
        const result = await deleteGeneration(generationId);

        if (result.success) {
            router.refresh();
        } else {
            alert('Failed to delete design');
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-red-500/80 text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20"
            title="Delete Design"
        >
            {isDeleting ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            )}
        </button>
    );
}
