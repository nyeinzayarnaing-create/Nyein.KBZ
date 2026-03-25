"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { hasVotedInCategory, setKingVoted, setQueenVoted, clearVoterId, getVotedCandidateId } from "@/lib/voter";
import { useVoterState } from "@/components/VoterGuard";
import { useSettings } from "@/hooks/useSettings";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";
import { useRealtimePerformanceVotes } from "@/hooks/useRealtimePerformanceVotes";
import { CandidateCard } from "@/components/CandidateCard";
import { PerformanceGroupCard } from "@/components/PerformanceGroupCard";
import { Leaderboard } from "@/components/Leaderboard";
import { PerformanceLeaderboard } from "@/components/PerformanceLeaderboard";
import { WinnerReveal } from "@/components/WinnerReveal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import type { Candidate, VoteCount, PerformanceGroup, PerformanceVoteCount } from "@/types";

type ConfirmState = {
  show: boolean;
  title: string;
  message: string;
  buttonText: string;
  onConfirm?: () => void;
  cancelText?: string;
};

export default function VotePage() {
  const router = useRouter();
  const { settings, loading: settingsLoading } = useSettings();
  const { voterId, kingVoted, queenVoted, performanceVoted, isHydrated, refetch: refetchVoter } = useVoterState();
  const [localKingVoted, setLocalKingVoted] = useState<string | null>(null);
  const [localQueenVoted, setLocalQueenVoted] = useState<string | null>(null);
  const [localPerformanceVoted, setLocalPerformanceVoted] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [groups, setGroups] = useState<PerformanceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReveal, setShowReveal] = useState(false);
  const [showPerformanceReveal, setShowPerformanceReveal] = useState(false);

  const voteCounts = useRealtimeVotes(candidates);
  const perfVoteCounts = useRealtimePerformanceVotes(groups);

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
    if (settings?.winners_revealed) setShowReveal(true);
    if (settings?.performance_winners_revealed) setShowPerformanceReveal(true);
  }, [settings?.winners_revealed, settings?.performance_winners_revealed]);

  useEffect(() => {
    setLocalKingVoted(kingVoted);
    setLocalQueenVoted(queenVoted);
    setLocalPerformanceVoted(performanceVoted);
  }, [kingVoted, queenVoted, performanceVoted]);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;
      const { data: candData } = await supabase
        .from("candidates")
        .select("*")
        .order("name");
      setCandidates((candData as Candidate[]) ?? []);

      const { data: groupData } = await supabase
        .from("performance_groups")
        .select("*")
        .order("name");
      setGroups((groupData as PerformanceGroup[]) ?? []);

      setLoading(false);
    }
    fetchData();
  }, []);

  const mainVotingClosed = !settings?.voting_active;
  const perfVotingClosed = !settings?.performance_voting_active;

  const isPerformanceRelevant = !!settings?.performance_voting_active || localPerformanceVoted !== null;

  const showKingSection = localKingVoted === null;
  const showQueenSection = localKingVoted !== null && localQueenVoted === null;
  const showPerformanceSection = localKingVoted !== null && localQueenVoted !== null && localPerformanceVoted === null && isPerformanceRelevant;
  const showComplete = localKingVoted !== null && localQueenVoted !== null && (!isPerformanceRelevant || localPerformanceVoted !== null);

  const isCurrentlyClosed = (showKingSection || showQueenSection) ? mainVotingClosed : (showPerformanceSection ? perfVotingClosed : false);

  function handleVoteClick(candidateId: string, candidate: Candidate) {
    if (!supabase || !voterId || voting || mainVotingClosed) return;
    if (getVotedCandidateId(candidate.gender)) return;
    if (candidate.employee_id === voterId) {
      alert("You cannot vote for yourself!");
      return;
    }
    setConfirm({
      show: true,
      title: "Confirm Your Vote",
      message: `Are you sure you want to vote for ${candidate.name} as ${candidate.gender === "king" ? "Men" : "Lady"}?`,
      buttonText: "Yes, Vote!",
      cancelText: "Cancel",
      onConfirm: () => executeVote(candidateId, candidate),
    });
  }

  async function executeVote(candidateId: string, candidate: Candidate) {
    if (!supabase || !voterId || voting || mainVotingClosed) return;
    if (getVotedCandidateId(candidate.gender)) return;
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

  function handlePerformanceVoteClick(groupId: string, group: PerformanceGroup) {
    if (!supabase || !voterId || voting || perfVotingClosed) return;
    if (localPerformanceVoted) return;

    setConfirm({
      show: true,
      title: "Confirm Your Vote",
      message: `Are you sure you want to vote for ${group.name}?`,
      buttonText: "Yes, Vote!",
      cancelText: "Cancel",
      onConfirm: () => executePerformanceVote(groupId, group),
    });
  }

  async function executePerformanceVote(groupId: string, group: PerformanceGroup) {
    if (!supabase || !voterId || voting || perfVotingClosed) return;
    if (localPerformanceVoted) return;

    setVoting(true);
    try {
      const { data: existing } = await supabase
        .from("performance_votes")
        .select("id")
        .eq("voter_id", voterId)
        .single();

      if (existing) {
        setVoting(false);
        return;
      }

      const { error } = await supabase.from("performance_votes").insert({
        voter_id: voterId,
        group_id: groupId,
      });

      if (!error) {
        import("@/lib/voter").then(m => m.setPerformanceVoted(groupId));
        setLocalPerformanceVoted(groupId);
        refetchVoter();
        setConfirm({
          show: true,
          title: "🎉 Vote recorded!",
          message: `You voted for ${group.name} as Best Performance Group. Thank you for voting!`,
          buttonText: "Done ✨",
        });
      }
    } finally {
      setVoting(false);
    }
  }

  const query = searchQuery.trim().toLowerCase();
  const filterByName = (item: { name: string }) =>
    !query || item.name.toLowerCase().includes(query);

  const kings = candidates.filter((c) => c.gender === "king" && filterByName(c));
  const queens = candidates.filter((c) => c.gender === "queen" && filterByName(c));
  const filteredGroups = groups.filter(filterByName);

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
    performance: PerformanceVoteCount | null;
  } {
    const kingsList = voteCounts
      .filter((v) => v.gender === "king")
      .sort((a, b) => b.vote_count - a.vote_count);
    const queensList = voteCounts
      .filter((v) => v.gender === "queen")
      .sort((a, b) => b.vote_count - a.vote_count);
    const perfList = [...perfVoteCounts]
      .sort((a, b) => b.vote_count - a.vote_count);
    return {
      king: kingsList[0] ?? null,
      queen: queensList[0] ?? null,
      performance: perfList[0] ?? null,
    };
  }

  const { king, queen, performance } = getWinners();

  return (
    <main className="min-h-screen pb-16 max-w-2xl mx-auto bg-[#faf9f7] px-4">
      <div className="sticky top-0 z-50 bg-[#faf9f7]/95 backdrop-blur-md -mx-4 pt-8 pb-3 border-b border-gray-100 mb-8 mt-2">
        <header className="relative flex items-center justify-between px-4 py-2">
          <div className="w-1/4 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-xl shadow-lg shadow-purple-200/50">
              👑
            </div>
          </div>
          <div className="text-center flex-1">
            <h1 className="font-display text-2xl font-extrabold gradient-text">
              {showKingSection ? "✨ Vote Men" : showQueenSection ? "✨ Vote Lady" : showPerformanceSection ? "🎭 Vote Performance" : "✨ Results ✨"}
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

        {!isCurrentlyClosed && !showComplete && !showReveal && !showPerformanceReveal && (
          <div className="px-4 mb-2">
            <input
              type="search"
              placeholder={
                showKingSection
                  ? "🔍 Search Men by name..."
                  : showQueenSection
                    ? "🔍 Search Lady by name..."
                    : "🔍 Search Groups by name..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      <div className="pt-2">
        {showPerformanceReveal ? (
          <div className="py-4">
            <WinnerReveal
              kingWinner={null}
              queenWinner={null}
              performanceWinner={performance ? { name: performance.name, photo_url: performance.photo_url, vote_count: performance.vote_count } : null}
              onComplete={() => setShowPerformanceReveal(false)}
            />
            <div className="mt-12 max-w-xl mx-auto animate-bounce-in">
              <PerformanceLeaderboard voteCounts={perfVoteCounts} />
            </div>
          </div>
        ) : showReveal ? (
          <div className="py-4">
            <WinnerReveal
              kingWinner={king ? { name: king.name, photo_url: king.photo_url, vote_count: king.vote_count } : null}
              queenWinner={queen ? { name: queen.name, photo_url: queen.photo_url, vote_count: queen.vote_count } : null}
              onComplete={() => setShowReveal(false)}
            />
            <div className="mt-12 space-y-12 animate-bounce-in">
              <div className="grid md:grid-cols-2 gap-12">
                <Leaderboard voteCounts={voteCounts} category="king" />
                <Leaderboard voteCounts={voteCounts} category="queen" />
              </div>
            </div>
          </div>
        ) : showComplete ? (
          isPerformanceRelevant ? (
            perfVotingClosed ? (
              <div className="space-y-12">
                <div className="text-center py-10 rounded-3xl bg-white border border-gray-100 card-shadow">
                  <span className="text-4xl mb-4 block">🔒</span>
                  <p className="text-gray-700 text-lg font-semibold">Voting is currently closed</p>
                  <p className="text-gray-400 text-sm mt-2">See the results below!</p>
                </div>
                <div className="max-w-xl mx-auto animate-bounce-in">
                  <PerformanceLeaderboard voteCounts={perfVoteCounts} />
                </div>
              </div>
            ) : (
              <div className="text-center py-16 rounded-2xl bg-white border border-gray-100 card-shadow">
                <span className="text-5xl mb-4 block animate-bounce-in">⏳</span>
                <p className="gradient-text text-2xl font-display font-bold mb-2">Thank you for voting!</p>
                <p className="text-gray-400">Waiting for Best Group voting to close to see the results...</p>
              </div>
            )
          ) : (
            mainVotingClosed ? (
              <div className="space-y-12">
                <div className="text-center py-10 rounded-3xl bg-white border border-gray-100 card-shadow">
                  <span className="text-4xl mb-4 block">🔒</span>
                  <p className="text-gray-700 text-lg font-semibold">Voting is currently closed</p>
                  <p className="text-gray-400 text-sm mt-2">See the results below!</p>
                </div>
                <div className="space-y-12 animate-bounce-in">
                  <div className="grid md:grid-cols-2 gap-12">
                    <Leaderboard voteCounts={voteCounts} category="king" />
                    <Leaderboard voteCounts={voteCounts} category="queen" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 rounded-2xl bg-white border border-gray-100 card-shadow">
                <span className="text-5xl mb-4 block animate-bounce-in">⏳</span>
                <p className="gradient-text text-2xl font-display font-bold mb-2">Thank you for voting!</p>
                <p className="text-gray-400">Waiting for Men & Lady voting to close to see the results...</p>
              </div>
            )
          )
        ) : isCurrentlyClosed ? (
          <div className="space-y-12">
            <div className="text-center py-10 rounded-3xl bg-white border border-gray-100 card-shadow">
              <span className="text-4xl mb-4 block">🔒</span>
              <p className="text-gray-700 text-lg font-semibold">Voting is currently closed</p>
              <p className="text-gray-400 text-sm mt-2">
                The session has ended. See the results below!
              </p>
            </div>

            {showPerformanceSection ? (
              <div className="max-w-xl mx-auto animate-bounce-in">
                <PerformanceLeaderboard voteCounts={perfVoteCounts} />
              </div>
            ) : (
              <div className="space-y-12 animate-bounce-in">
                <div className="grid md:grid-cols-2 gap-12">
                  <Leaderboard voteCounts={voteCounts} category="king" />
                  <Leaderboard voteCounts={voteCounts} category="queen" />
                </div>
              </div>
            )}
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
                        onVote={(id) => handleVoteClick(id, c)}
                        disabled={mainVotingClosed || localKingVoted !== null}
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
                        onVote={(id) => handleVoteClick(id, c)}
                        disabled={mainVotingClosed || localQueenVoted !== null}
                        voted={localQueenVoted === c.id}
                        isSelf={c.employee_id === voterId}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {showPerformanceSection && (
              <section>
                <div className="grid grid-cols-1 gap-6 sm:px-4">
                  {filteredGroups.map((g, i) => (
                    <div key={g.id} className="animate-bounce-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <PerformanceGroupCard
                        group={g}
                        onVote={(id) => handlePerformanceVoteClick(id, g)}
                        disabled={isCurrentlyClosed || localPerformanceVoted !== null}
                        voted={localPerformanceVoted === g.id}
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
        onConfirm={confirm.onConfirm}
        cancelText={confirm.cancelText}
        onClose={() => setConfirm((p) => ({ ...p, show: false }))}
      />

      <footer className="fixed bottom-0 left-0 w-full py-3 text-center bg-[#faf9f7]/80 backdrop-blur-sm z-40 border-t border-gray-100">
        <p className="text-[#6c5ce7]/50 text-sm font-medium">Supported by UX Team</p>
      </footer>
    </main>
  );
}
