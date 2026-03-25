"use client";

import { useState } from "react";
import type { Candidate } from "@/types";

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

type CandidateCardProps = {
  candidate: Candidate;
  onVote: (candidateId: string) => void;
  disabled: boolean;
  voted: boolean;
  isSelf?: boolean;
};

export function CandidateCard({
  candidate,
  onVote,
  disabled,
  voted,
  isSelf = false,
}: CandidateCardProps) {
  const [imgError, setImgError] = useState(false);
  const photoSrc = candidate.photo_url ? getDirectGoogleDriveLink(candidate.photo_url) : null;

  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-white card-shadow
        ${voted ? "border-[#6c5ce7] ring-2 ring-purple-200 scale-[0.98]" : "border-gray-100 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-100/50"}
        ${disabled && !voted ? "opacity-50" : ""}
        ${!disabled && !voted ? "hover:scale-[1.02] active:scale-[0.98] cursor-pointer" : ""}
      `}
    >
      <div className="aspect-[3/4] bg-gray-50 relative">
        {photoSrc && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoSrc}
            alt={candidate.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
            <span className="text-5xl">
              {candidate.gender === "king" ? "👑" : "👸"}
            </span>
          </div>
        )}
        {voted && (
          <div className="absolute inset-0 bg-[#6c5ce7]/20 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-white/90 rounded-full px-4 py-2 shadow-lg">
              <span className="text-[#6c5ce7] text-lg font-bold">✓ Voted</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 bg-white">
        <h3 className="font-display font-semibold text-lg text-gray-800 truncate">
          {candidate.name}
        </h3>
        <button
          onClick={() => onVote(candidate.id)}
          disabled={disabled || voted || isSelf}
          className={`
            w-full mt-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300
            ${voted ? "bg-purple-50 text-[#6c5ce7] cursor-default" : ""}
            ${isSelf ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
            ${disabled && !voted && !isSelf ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
            ${!disabled && !voted && !isSelf ? "bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white hover:shadow-md hover:shadow-purple-200 active:scale-95" : ""}
          `}
        >
          {voted ? "✓ Voted" : isSelf ? "Self ✋" : "Vote 🗳️"}
        </button>
      </div>
    </div>
  );
}
