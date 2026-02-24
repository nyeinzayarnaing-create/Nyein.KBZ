"use client";

import Image from "next/image";
import type { VoteCount } from "@/types";

type LeaderboardProps = {
  voteCounts: VoteCount[];
  category: "king" | "queen";
};

export function Leaderboard({ voteCounts, category }: LeaderboardProps) {
  const top5 = voteCounts
    .filter((v) => v.gender === category)
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, 5);

  const isKing = category === "king";
  const emoji = isKing ? "👑" : "👸";
  const accentFrom = isKing ? "from-blue-400" : "from-pink-400";
  const accentTo = isKing ? "to-blue-500" : "to-pink-500";
  const borderColor = isKing ? "border-blue-200" : "border-pink-200";
  const bgLight = isKing ? "bg-blue-50" : "bg-pink-50";

  return (
    <div className={`bg-white rounded-3xl p-6 card-shadow border ${borderColor}`}>
      <h2 className="font-display text-2xl md:text-3xl font-extrabold text-center mb-5">
        <span className="text-3xl mr-2">{emoji}</span>
        <span className={`bg-gradient-to-r ${accentFrom} ${accentTo} bg-clip-text text-transparent`}>
          {isKing ? "King" : "Queen"} Leaderboard
        </span>
      </h2>
      {top5.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No votes yet</p>
      ) : (
        <div className="space-y-3">
          {top5.map((item, index) => (
            <div
              key={item.candidate_id}
              className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 hover:scale-[1.01] ${index === 0 ? `${bgLight} border ${borderColor}` : "hover:bg-gray-50"
                }`}
            >
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0
                  ? `bg-gradient-to-r ${accentFrom} ${accentTo} text-white`
                  : "bg-gray-100 text-gray-500"
                }`}>
                {index + 1}
              </div>

              {/* Photo */}
              <div className={`w-12 h-12 rounded-full overflow-hidden ${bgLight} border-2 ${borderColor} flex-shrink-0`}>
                {item.photo_url ? (
                  <Image
                    src={item.photo_url}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">
                    {emoji}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{item.name}</p>
              </div>

              {/* Vote count */}
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${index === 0
                  ? `bg-gradient-to-r ${accentFrom} ${accentTo} text-white`
                  : `${bgLight} text-gray-600`
                }`}>
                {item.vote_count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
