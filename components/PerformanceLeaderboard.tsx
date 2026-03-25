import { useState } from "react";
import type { PerformanceVoteCount } from "@/types";

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

type PerformanceLeaderboardProps = {
    voteCounts: PerformanceVoteCount[];
};

export function PerformanceLeaderboard({ voteCounts }: PerformanceLeaderboardProps) {
    const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

    const handleImgError = (id: string) => {
        setImgErrors((prev) => ({ ...prev, [id]: true }));
    };

    const top5 = [...voteCounts]
        .sort((a, b) => b.vote_count - a.vote_count)
        .slice(0, 5);

    const emoji = "🎭";
    const accentFrom = "from-[#00b894]";
    const accentTo = "to-[#55efc4]";
    const borderColor = "border-[#00b894]/20";
    const bgLight = "bg-[#00b894]/5";

    return (
        <div className={`bg-white rounded-3xl p-6 card-shadow border ${borderColor}`}>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-center mb-5">
                <span className="text-3xl mr-2">{emoji}</span>
                <span className={`bg-gradient-to-r ${accentFrom} ${accentTo} bg-clip-text text-transparent`}>
                    Best Group
                </span>
            </h2>
            {top5.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No votes yet</p>
            ) : (
                <div className="space-y-3">
                    {top5.map((item, index) => (
                        <div
                            key={item.group_id}
                            className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 hover:scale-[1.01] ${index === 0 ? `${bgLight} border ${borderColor}` : "hover:bg-gray-50"
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0
                                ? `bg-gradient-to-r ${accentFrom} ${accentTo} text-white`
                                : "bg-gray-100 text-gray-500"
                                }`}>
                                {index + 1}
                            </div>

                            <div className={`w-16 h-12 rounded-xl overflow-hidden ${bgLight} border-2 ${borderColor} flex-shrink-0 relative`}>
                                {item.photo_url && !imgErrors[item.group_id] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={getDirectGoogleDriveLink(item.photo_url)}
                                        alt={item.name}
                                        onError={() => handleImgError(item.group_id)}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg">
                                        {emoji}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                            </div>

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
