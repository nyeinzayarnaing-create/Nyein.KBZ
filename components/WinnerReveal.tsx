"use client";

import { useEffect } from "react";
import confetti, { type Options as ConfettiOptions } from "canvas-confetti";
import Image from "next/image";

type Winner = {
  name: string;
  photo_url: string | null;
  vote_count: number;
};

type WinnerRevealProps = {
  kingWinner: Winner | null;
  queenWinner: Winner | null;
  onComplete?: () => void;
};

function burst() {
  const count = 200;
  const defaults = {
    origin: { y: 0.6 },
    colors: ["#6c5ce7", "#a29bfe", "#fd79a8", "#fdcb6e", "#00cec9"],
  };

  function fire(particleRatio: number, opts: ConfettiOptions) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export function WinnerReveal({
  kingWinner,
  queenWinner,
  onComplete,
}: WinnerRevealProps) {
  useEffect(() => {
    if (kingWinner || queenWinner) {
      burst();
      const t = setTimeout(() => burst(), 400);
      return () => clearTimeout(t);
    }
  }, [kingWinner, queenWinner]);

  return (
    <div className="flex flex-col items-center">
      <h2 className="font-display text-4xl font-extrabold gradient-text mb-8 animate-bounce-in">
        🎊 Winners! 🎊
      </h2>
      <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch animate-bounce-in">
        {kingWinner && (
          <WinnerCard
            title="King"
            emoji="👑"
            name={kingWinner.name}
            photoUrl={kingWinner.photo_url}
            voteCount={kingWinner.vote_count}
            accentFrom="from-blue-400"
            accentTo="to-blue-500"
            borderColor="border-blue-200"
            bgLight="bg-blue-50"
          />
        )}
        {queenWinner && (
          <WinnerCard
            title="Queen"
            emoji="👸"
            name={queenWinner.name}
            photoUrl={queenWinner.photo_url}
            voteCount={queenWinner.vote_count}
            accentFrom="from-pink-400"
            accentTo="to-pink-500"
            borderColor="border-pink-200"
            bgLight="bg-pink-50"
          />
        )}
      </div>
      {onComplete && (kingWinner || queenWinner) && (
        <div className="mt-10">
          <button
            onClick={onComplete}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-300/40 hover:scale-105 active:scale-95"
          >
            Done ✨
          </button>
        </div>
      )}
    </div>
  );
}

function WinnerCard({
  title,
  emoji,
  name,
  photoUrl,
  voteCount,
  accentFrom,
  accentTo,
  borderColor,
  bgLight,
}: {
  title: string;
  emoji: string;
  name: string;
  photoUrl: string | null;
  voteCount: number;
  accentFrom: string;
  accentTo: string;
  borderColor: string;
  bgLight: string;
}) {
  return (
    <div className={`flex flex-col items-center w-72 p-8 rounded-3xl border-2 ${borderColor} bg-white card-shadow`}>
      <span className="text-5xl mb-3 animate-float">{emoji}</span>
      <h3 className={`font-display text-2xl font-extrabold uppercase tracking-wider bg-gradient-to-r ${accentFrom} ${accentTo} bg-clip-text text-transparent`}>
        {title}
      </h3>
      <div className={`mt-5 w-40 h-40 rounded-full overflow-hidden ${bgLight} border-4 ${borderColor} flex-shrink-0`}>
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={name}
            width={160}
            height={160}
            className="object-cover w-full h-full"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {emoji}
          </div>
        )}
      </div>
      <p className="mt-5 font-display text-2xl font-bold text-gray-800 text-center truncate w-full">
        {name}
      </p>
      <p className={`mt-1.5 text-lg font-semibold bg-gradient-to-r ${accentFrom} ${accentTo} bg-clip-text text-transparent`}>
        {voteCount} votes
      </p>
    </div>
  );
}
