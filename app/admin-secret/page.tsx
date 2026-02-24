"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/hooks/useSettings";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";
import { Timer } from "@/components/Timer";
import { Leaderboard } from "@/components/Leaderboard";
import { WinnerReveal } from "@/components/WinnerReveal";
import type { Candidate, VoteCount } from "@/types";

export default function AdminPage() {
  const { settings, refetch } = useSettings();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showReveal, setShowReveal] = useState(false);
  const [voteRefreshKey, setVoteRefreshKey] = useState(0);

  const voteCounts = useRealtimeVotes(candidates, voteRefreshKey);

  useEffect(() => {
    async function fetchCandidates() {
      if (!supabase) return;
      const { data } = await supabase
        .from("candidates")
        .select("*")
        .order("name");
      setCandidates((data as Candidate[]) ?? []);
    }
    fetchCandidates();
  }, []);

  useEffect(() => {
    if (settings?.winners_revealed) setShowReveal(true);
  }, [settings?.winners_revealed]);

  async function handleStart(seconds: number) {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", timerSeconds: seconds }),
    });
    refetch();
  }

  async function handleStop() {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
    refetch();
  }

  function handleTimeUp() {
    handleStop();
    setShowReveal(true);
  }

  async function handleReset() {
    const res = await fetch("/api/admin/reset-votes", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(`Reset failed: ${data.error || res.statusText}${data.code ? ` (${data.code})` : ""}`);
      return;
    }
    setShowReveal(false);
    refetch();
    setVoteRefreshKey((k) => k + 1);
  }

  function getWinners(): {
    king: VoteCount | null;
    queen: VoteCount | null;
  } {
    const kings = voteCounts
      .filter((v) => v.gender === "king")
      .sort((a, b) => b.vote_count - a.vote_count);
    const queens = voteCounts
      .filter((v) => v.gender === "queen")
      .sort((a, b) => b.vote_count - a.vote_count);
    return {
      king: kings[0] ?? null,
      queen: queens[0] ?? null,
    };
  }

  const { king, queen } = getWinners();
  const hasVotes = voteCounts.some((v) => v.vote_count > 0);

  return (
    <main className="min-h-screen p-8 pb-16 bg-[#faf9f7] flex flex-col">
      <header className="text-center mb-8">
        <div className="flex items-center justify-between max-w-5xl mx-auto mb-4">
          <div className="text-left">
            <h1 className="font-display text-4xl md:text-5xl font-extrabold gradient-text">
              {"F21's King & Queen"}
            </h1>
            <p className="text-gray-400 mt-2">
              Manage your King &amp; Queen voting session
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                await fetch("/api/admin/logout", { method: "POST" });
                window.location.href = "/admin-login";
              } catch {
                window.location.href = "/admin-login";
              }
            }}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 card-shadow"
          >
            <span>Logout</span>
          </button>
        </div>
        <div className="mt-3">
          <Link
            href="/admin-secret/members"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white border border-purple-200 text-[#6c5ce7] hover:bg-purple-50 hover:border-purple-300 font-semibold transition-all duration-300 hover:scale-105 active:scale-95 card-shadow"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            👥 Manage Members
          </Link>
        </div>
      </header>

      {showReveal ? (
        <div className="py-12">
          <WinnerReveal
            kingWinner={
              king
                ? {
                  name: king.name,
                  photo_url: king.photo_url,
                  vote_count: king.vote_count,
                }
                : null
            }
            queenWinner={
              queen
                ? {
                  name: queen.name,
                  photo_url: queen.photo_url,
                  vote_count: queen.vote_count,
                }
                : null
            }
            onComplete={() => setShowReveal(false)}
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-12">
          <Timer
            settings={settings}
            onTimeUp={handleTimeUp}
            isAdmin
            onStart={handleStart}
            onStop={handleStop}
            onReset={handleReset}
          />

          {hasVotes && (
            <div className="grid md:grid-cols-2 gap-12">
              <Leaderboard voteCounts={voteCounts} category="king" />
              <Leaderboard voteCounts={voteCounts} category="queen" />
            </div>
          )}
        </div>
      )}
      <footer className="mt-auto pt-12 text-center">
        <p className="text-[#6c5ce7]/50 text-sm font-medium">Supported by UX Team</p>
      </footer>
    </main>
  );
}
