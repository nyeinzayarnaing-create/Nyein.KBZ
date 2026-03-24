"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { hasVotedInCategory, setKingVoted, setQueenVoted, clearVoterId } from "@/lib/voter";
import { useVoterState } from "@/components/VoterGuard";
import { useSettings } from "@/hooks/useSettings";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";
import { CandidateCard } from "@/components/CandidateCard";
import { Leaderboard } from "@/components/Leaderboard";
import { WinnerReveal } from "@/components/WinnerReveal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import type { Candidate, VoteCount } from "@/types";

type ConfirmState = {
  show: boolean;
  title: string;
  message: string;
  buttonText: string;
};

export default function VotePage() {
  const router = useRouter();
  const { settings, loading: settingsLoading } = useSettings();
  const { voterId, kingVoted, queenVoted, isHydrated, refetch: refetchVoter } = useVoterState();
  const [localKingVoted, setLocalKingVoted] = useState<string | null>(null);
  const [localQueenVoted, setLocalQueenVoted] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReveal, setShowReveal] = useState(false);

  const voteCounts = useRealtimeVotes(candidates);

  const [confirm, setConfirm] = useState<ConfirmState>({
    show: false,
    title: "",
    message: "",
    buttonText: "OK",
  });

  useEffect(() => {
    if (isHydrated && voterId === null) {
      router.push("/login");
    }
  }, [voterId, isHydrated, router]);

  useEffect(() => {
    if (settings?.winners_revealed) {
      setShowReveal(true);
    }
  }, [settings?.winners_revealed]);

  useEffect(() => {
    setLocalKingVoted(kingVoted);
    setLocalQueenVoted(queenVoted);
  }, [kingVoted, queenVoted]);

  useEffect(() => {
    async function fetchCandidates() {
      if (!supabase) return;
      const { data } = await supabase
        .from("candidates")
        .select("*")
        .order("name");
      setCandidates((data as Candidate[]) ?? []);
      setLoading(false);
    }
    fetchCandidates();
  }, []);

  const votingClosed = !settings?.voting_active;

  async function handleVote(candidateId: string, candidate: Candidate) {
    if (!supabase || !voterId || voting || votingClosed) return;
    if (hasVotedInCategory(candidate.gender)) return;
    if (candidate.employee_id === voterId) {
      alert("You cannot vote for yourself!");
      return;
    }

    setVoting(true);
    try {
      const { data: existing } = await supabase
        .from("votes")
        .select("id")
        .eq("voter_id", voterId)
        .in(
          "candidate_id",
          candidates.filter((c) => c.gender === candidate.gender).map((c) => c.id)
        );

      if (existing && existing.length > 0) {
        setVoting(false);
        return;
      }

      const { error } = await supabase.from("votes").insert({
        voter_id: voterId,
        candidate_id: candidateId,
      });

      if (!error) {
        if (candidate.gender === "king") {
          setKingVoted(candidateId);
          setLocalKingVoted(candidateId);
          refetchVoter();
          setConfirm({
            show: true,
            title: "🎉 Vote recorded!",
            message: `You voted for ${candidate.name} as Men. Tap Continue to vote for Lady.`,
            buttonText: "Continue →",
          });
        } else {
          setQueenVoted(candidateId);
          setLocalQueenVoted(candidateId);
          refetchVoter();
          setConfirm({
            show: true,
            title: "🎉 Vote recorded!",
            message: `You voted for ${candidate.name} as Lady. Thank you for voting!`,
            buttonText: "Done ✨",
          });
        }
      }
    } finally {
      setVoting(false);
    }
  }

  const query = searchQuery.trim().toLowerCase();
  const filterByName = (c: Candidate) =>
    !query || c.name.toLowerCase().includes(query);

  const kings = candidates.filter((c) => c.gender === "king" && filterByName(c));
  const queens = candidates.filter((c) => c.gender === "queen" && filterByName(c));

  const showKingSection = localKingVoted === null;
  const showQueenSection = localKingVoted !== null && localQueenVoted === null;
  const showComplete = localKingVoted !== null && localQueenVoted !== null;

  if (loading || settingsLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center">
          <span className="text-4xl animate-float inline-block">👑</span>
          <p className="text-[#6c5ce7] font-medium mt-3 animate-pulse">Loading voting session...</p>
        </div>
      </div>
    );
  }

  function handleLogout() {
    clearVoterId();
    router.push("/login");
  }

  function getWinners(): {
    king: VoteCount | null;
    queen: VoteCount | null;
  } {
    const kingsList = voteCounts
      .filter((v) => v.gender === "king")
      .sort((a, b) => b.vote_count - a.vote_count);
    const queensList = voteCounts
      .filter((v) => v.gender === "queen")
      .sort((a, b) => b.vote_count - a.vote_count);
    return {
      king: kingsList[0] ?? null,
      queen: queensList[0] ?? null,
    };
  }

  const { king, queen } = getWinners();

  return (
    <main className="min-h-screen pb-16 max-w-2xl mx-auto bg-[#faf9f7] px-4">
      <div className="sticky top-0 z-50 bg-[#faf9f7]/90 backdrop-blur-md -mx-4 pt-4 pb-2 border-b border-gray-100 mb-6">
        <header className="relative flex items-center justify-between px-4 py-2">
          <div className="w-1/4"></div> {/* Spacer */}
          <div className="text-center flex-1">
            <h1 className="font-display text-2xl font-extrabold gradient-text">
              {showKingSection ? "✨ Vote Men" : showQueenSection ? "✨ Vote Lady" : "✨ Results ✨"}
            </h1>
          </div>
          <div className="w-1/4 flex justify-end">
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all font-semibold text-xs flex items-center gap-1 shadow-sm"
              title="Logout"
            >
              <span>Logout</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {!votingClosed && !showComplete && !showReveal && (
          <div className="px-4 mb-2">
            <input
              type="search"
              placeholder={
                showKingSection
                  ? "🔍 Search Men by name..."
                  : "🔍 Search Lady by name..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      <div className="pt-2">
        {showReveal ? (
          <div className="py-4">
            <WinnerReveal
              kingWinner={king ? { name: king.name, photo_url: king.photo_url, vote_count: king.vote_count } : null}
              queenWinner={queen ? { name: queen.name, photo_url: queen.photo_url, vote_count: queen.vote_count } : null}
              onComplete={() => setShowReveal(false)}
            />
            <div className="mt-12 space-y-12 animate-bounce-in">
              <Leaderboard voteCounts={voteCounts} category="king" />
              <Leaderboard voteCounts={voteCounts} category="queen" />
            </div>
          </div>
        ) : votingClosed ? (
          <div className="space-y-12">
            <div className="text-center py-10 rounded-3xl bg-white border border-gray-100 card-shadow">
              <span className="text-4xl mb-4 block">🔒</span>
              <p className="text-gray-700 text-lg font-semibold">Voting is currently closed</p>
              <p className="text-gray-400 text-sm mt-2">
                The session has ended. See the results below!
              </p>
            </div>

            <div className="space-y-12 animate-bounce-in">
              <Leaderboard voteCounts={voteCounts} category="king" />
              <Leaderboard voteCounts={voteCounts} category="queen" />
            </div>
          </div>
        ) : showComplete ? (
          <div className="text-center py-16 rounded-2xl bg-white border border-gray-100 card-shadow">
            <span className="text-5xl mb-4 block animate-bounce-in">🎊</span>
            <p className="gradient-text text-2xl font-display font-bold mb-2">
              Thank you for voting!
            </p>
            <p className="text-gray-400">You have completed your vote.</p>
          </div>
        ) : (
          <>
            {showKingSection && (
              <section>
                <div className="grid grid-cols-2 gap-4">
                  {kings.map((c, i) => (
                    <div key={c.id} className="animate-bounce-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <CandidateCard
                        candidate={c}
                        onVote={(id) => handleVote(id, c)}
                        disabled={votingClosed || localKingVoted !== null}
                        voted={localKingVoted === c.id}
                        isSelf={c.employee_id === voterId}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {showQueenSection && (
              <section>
                <div className="grid grid-cols-2 gap-4">
                  {queens.map((c, i) => (
                    <div key={c.id} className="animate-bounce-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <CandidateCard
                        candidate={c}
                        onVote={(id) => handleVote(id, c)}
                        disabled={votingClosed || localQueenVoted !== null}
                        voted={localQueenVoted === c.id}
                        isSelf={c.employee_id === voterId}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <ConfirmationModal
        show={confirm.show}
        title={confirm.title}
        message={confirm.message}
        buttonText={confirm.buttonText}
        onClose={() => setConfirm((p) => ({ ...p, show: false }))}
      />

      <footer className="fixed bottom-0 left-0 w-full py-3 text-center bg-[#faf9f7]/80 backdrop-blur-sm z-40 border-t border-gray-100">
        <p className="text-[#6c5ce7]/50 text-sm font-medium">Supported by UX Team</p>
      </footer>
    </main>
  );
}
