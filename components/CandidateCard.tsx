"use client";

import Image from "next/image";
import type { Candidate } from "@/types";

type CandidateCardProps = {
  candidate: Candidate;
  onVote: (candidateId: string) => void;
  disabled: boolean;
  voted: boolean;
};

export function CandidateCard({
  candidate,
  onVote,
  disabled,
  voted,
}: CandidateCardProps) {
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
        {candidate.photo_url ? (
          <Image
            src={candidate.photo_url}
            alt={candidate.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
            unoptimized
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
          disabled={disabled || voted}
          className={`
            w-full mt-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300
            ${voted ? "bg-purple-50 text-[#6c5ce7] cursor-default" : ""}
            ${disabled && !voted ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
            ${!disabled && !voted ? "bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white hover:shadow-md hover:shadow-purple-200 active:scale-95" : ""}
          `}
        >
          {voted ? "✓ Voted" : "Vote 🗳️"}
        </button>
      </div>
    </div>
  );
}
