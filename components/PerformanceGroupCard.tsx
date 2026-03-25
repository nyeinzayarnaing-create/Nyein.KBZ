"use client";

import { useState } from "react";
import type { PerformanceGroup } from "@/types";

// Convert any Google Drive share/view link to a directly embeddable CDN URL
function getDirectGoogleDriveLink(url: string): string {
    if (!url) return url;
    let id: string | null = null;
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) id = fileMatch[1];
    if (!id) {
        const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch) id = idMatch[1];
    }
    if (!id) {
        const lhMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (lhMatch) id = lhMatch[1];
    }
    return id ? `https://lh3.googleusercontent.com/d/${id}` : url;
}

type PerformanceGroupCardProps = {
    group: PerformanceGroup;
    onVote: (groupId: string) => void;
    disabled: boolean;
    voted: boolean;
};

export function PerformanceGroupCard({
    group,
    onVote,
    disabled,
    voted,
}: PerformanceGroupCardProps) {
    const [imgError, setImgError] = useState(false);
    const photoSrc = group.photo_url ? getDirectGoogleDriveLink(group.photo_url) : null;

    return (
        <div
            className={`
        relative rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-white card-shadow flex flex-col
        ${voted ? "border-[#00b894] ring-2 ring-[#00b894]/30 scale-[0.98]" : "border-gray-100 hover:border-[#00b894]/50 hover:shadow-lg hover:shadow-[#00b894]/20"}
        ${disabled && !voted ? "opacity-50" : ""}
        ${!disabled && !voted ? "hover:scale-[1.02] active:scale-[0.98] cursor-pointer" : ""}
      `}
        >
            <div className="aspect-[16/9] bg-gray-50 relative shrink-0 overflow-hidden">
                {photoSrc && !imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={photoSrc}
                        alt={group.name}
                        onError={() => setImgError(true)}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00b894]/10 to-[#55efc4]/10">
                        <span className="text-5xl">🎭</span>
                    </div>
                )}
                {voted && (
                    <div className="absolute inset-0 bg-[#00b894]/20 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="bg-white/95 rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2">
                            <span className="text-[#00b894] text-lg font-bold">✓ Voted</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 bg-white flex-1 flex flex-col">
                <h3 className="font-display font-semibold text-xl text-gray-800 text-center mb-3 line-clamp-2">
                    {group.name}
                </h3>
                <div className="mt-auto">
                    <button
                        onClick={() => onVote(group.id)}
                        disabled={disabled || voted}
                        className={`
              w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300
              ${voted ? "bg-[#00b894]/10 text-[#00b894] cursor-default" : ""}
              ${disabled && !voted ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
              ${!disabled && !voted ? "bg-gradient-to-r from-[#00b894] to-[#55efc4] text-white shadow-lg shadow-[#00b894]/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]" : ""}
            `}
                    >
                        {voted ? "✓ Voted" : "Vote 🎭"}
                    </button>
                </div>
            </div>
        </div>
    );
}
