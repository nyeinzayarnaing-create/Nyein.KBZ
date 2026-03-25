"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/hooks/useSettings";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";
import { useRealtimePerformanceVotes } from "@/hooks/useRealtimePerformanceVotes";
import { Timer } from "@/components/Timer";
import { Leaderboard } from "@/components/Leaderboard";
import { PerformanceLeaderboard } from "@/components/PerformanceLeaderboard";
import { WinnerReveal } from "@/components/WinnerReveal";
import type { Candidate, VoteCount, PerformanceGroup, PerformanceVoteCount } from "@/types";

export default function AdminPage() {
  const { settings, refetch } = useSettings();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [groups, setGroups] = useState<PerformanceGroup[]>([]);
  const [showReveal, setShowReveal] = useState(false);
  const [showPerformanceReveal, setShowPerformanceReveal] = useState(false);
  const [voteRefreshKey, setVoteRefreshKey] = useState(0);

  const voteCounts = useRealtimeVotes(candidates, voteRefreshKey);
  const perfVoteCounts = useRealtimePerformanceVotes(groups, voteRefreshKey);

  useEffect(() => {
    async function fetchCandidates() {
      if (!supabase) return;
      const { data } = await supabase
        .from("candidates")
        .select("*")
        .order("name");
      setCandidates((data as Candidate[]) ?? []);

      const { data: gData } = await supabase
        .from("performance_groups")
        .select("*")
        .order("name");
      setGroups((gData as PerformanceGroup[]) ?? []);
    }
    fetchCandidates();
  }, []);

  useEffect(() => {
    if (settings?.winners_revealed) setShowReveal(true);
    if (settings?.performance_winners_revealed) setShowPerformanceReveal(true);
  }, [settings?.winners_revealed, settings?.performance_winners_revealed]);

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
    setShowPerformanceReveal(false);
    refetch();
    setVoteRefreshKey((k) => k + 1);
  }

  async function handleStartPerformance(seconds: number) {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start-performance", timerSeconds: seconds }),
    });
    refetch();
  }

  async function handleStopPerformance() {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop-performance" }),
    });
    refetch();
  }

  async function handleResetPerformance() {
    if (!confirm("Are you sure you want to clear ALL Best Group votes? This cannot be undone.")) {
      return;
    }
    await fetch("/api/admin/reset-votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "performance" }),
    });
    setShowPerformanceReveal(false);
    refetch();
    setVoteRefreshKey((k) => k + 1);
  }

  function getWinners(): {
    king: VoteCount | null;
    queen: VoteCount | null;
    performance: PerformanceVoteCount | null;
  } {
    const kings = voteCounts
      .filter((v) => v.gender === "king")
      .sort((a, b) => b.vote_count - a.vote_count);
    const queens = voteCounts
      .filter((v) => v.gender === "queen")
      .sort((a, b) => b.vote_count - a.vote_count);
    const perfs = [...perfVoteCounts].sort((a, b) => b.vote_count - a.vote_count);
    return {
      king: kings[0] ?? null,
      queen: queens[0] ?? null,
      performance: perfs[0] ?? null,
    };
  }

  const { king, queen, performance } = getWinners();
  const hasVotes = voteCounts.some((v) => v.vote_count > 0);
  const hasPerfVotes = perfVoteCounts.some((v) => v.vote_count > 0);

  return (
    <main className="min-h-screen p-8 pb-16 bg-[#faf9f7] flex flex-col">
      <header className="text-center mb-8">
        <div className="flex items-center justify-between max-w-5xl mx-auto mb-6 mt-4">
          <div className="text-left flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-3xl md:text-4xl shadow-xl shadow-purple-200/50">
              👑
            </div>
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold gradient-text p-2">
                Stars of the Night
              </h1>
              <p className="text-gray-400 mt-1">
                Manage your voting session
              </p>
            </div>
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
        <div className="mt-3 flex gap-3 justify-center">
          <Link
            href="/admin-secret/members"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white border border-purple-200 text-[#6c5ce7] hover:bg-purple-50 hover:border-purple-300 font-semibold transition-all duration-300 hover:scale-105 active:scale-95 card-shadow"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            👥 Manage Members
          </Link>
          <Link
            href="/admin-secret/performance-groups"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white border border-[#00b894] text-[#00b894] hover:bg-[#00b894]/10 hover:border-[#00b894]/50 font-semibold transition-all duration-300 hover:scale-105 active:scale-95 card-shadow"
          >
            <span className="text-xl leading-none">🎭</span>
            Manage Performance Groups
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
      ) : showPerformanceReveal ? (
        <div className="py-12">
          <WinnerReveal
            kingWinner={null}
            queenWinner={null}
            performanceWinner={
              performance
                ? {
                  name: performance.name,
                  photo_url: performance.photo_url,
                  vote_count: performance.vote_count,
                }
                : null
            }
            onComplete={() => setShowPerformanceReveal(false)}
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 card-shadow flex flex-col items-center">
            <h2 className="text-2xl font-display font-bold gradient-text mb-4 text-center">Men & Lady Voting</h2>
            <Timer
              settings={settings}
              type="main"
              onTimeUp={handleTimeUp}
              isAdmin
              onStart={handleStart}
              onStop={handleStop}
              onReset={handleReset}
            />
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 card-shadow flex flex-col items-center">
            <h2 className="text-2xl font-display font-bold text-[#00b894] mb-4 text-center flex items-center gap-2">
              <span className="text-2xl leading-none">🎭</span>
              Best Performance Group Voting
            </h2>
            <Timer
              settings={settings}
              type="performance"
              onTimeUp={() => {
                // Just let it stop, same as King/Queen timeout
                handleStopPerformance();
              }}
              isAdmin
              onStart={handleStartPerformance}
              onStop={handleStopPerformance}
              onReset={handleResetPerformance}
            />
          </div>

          {!settings?.voting_active && hasVotes && (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/admin/settings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "reveal", type: "main" }), // Need to update API if missing
                    });
                    setShowReveal(true);
                  } catch {
                    alert("Failed to reveal winners");
                  }
                }}
                className="px-6 py-2 rounded-xl bg-purple-100 text-[#6c5ce7] font-bold transition-all hover:bg-purple-200"
              >
                Reveal Men & Lady Winners
              </button>
              <div className="grid md:grid-cols-2 gap-12 animate-bounce-in w-full">
                <Leaderboard voteCounts={voteCounts} category="king" />
                <Leaderboard voteCounts={voteCounts} category="queen" />
              </div>
            </div>
          )}

          {!settings?.performance_voting_active && hasPerfVotes && (
            <div className="flex flex-col items-center gap-4 mt-12">
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/admin/settings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "reveal", type: "performance" }), // Need to update API
                    });
                    setShowPerformanceReveal(true);
                  } catch {
                    alert("Failed to reveal winners");
                  }
                }}
                className="px-6 py-2 rounded-xl bg-[#00b894]/10 text-[#00b894] font-bold transition-all hover:bg-[#00b894]/20"
              >
                Reveal Performance Winner
              </button>
              <div className="w-full max-w-xl mx-auto animate-bounce-in">
                <PerformanceLeaderboard voteCounts={perfVoteCounts} />
              </div>
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
