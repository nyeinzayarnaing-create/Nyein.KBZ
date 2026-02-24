"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getVoterId, hasVotedInCategory, setKingVoted, setQueenVoted } from "@/lib/voter";
import { useVoterState } from "@/components/VoterGuard";
import { useSettings } from "@/hooks/useSettings";
import { CandidateCard } from "@/components/CandidateCard";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import type { Candidate } from "@/types";

type ConfirmState = {
  show: boolean;
  title: string;
  message: string;
  buttonText: string;
};

export default function VotePage() {
  const { settings } = useSettings();
  const { voterId, kingVoted, queenVoted, refetch: refetchVoter } = useVoterState();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState>({
    show: false,
    title: "",
    message: "",
    buttonText: "OK",
  });

  useEffect(() => {
    getVoterId();
  }, []);

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
          refetchVoter();
          setConfirm({
            show: true,
            title: "🎉 Vote recorded!",
            message: `You voted for ${candidate.name} as King. Tap Continue to vote for Queen.`,
            buttonText: "Continue →",
          });
        } else {
          setQueenVoted(candidateId);
          refetchVoter();
          setConfirm({
            show: true,
            title: "🎉 Vote recorded!",
            message: `You voted for ${candidate.name} as Queen. Thank you for voting!`,
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

  const showKingSection = kingVoted === null;
  const showQueenSection = kingVoted !== null && queenVoted === null;
  const showComplete = kingVoted !== null && queenVoted !== null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center">
          <span className="text-4xl animate-float inline-block">👑</span>
          <p className="text-[#6c5ce7] font-medium mt-3 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-16 max-w-2xl mx-auto bg-[#faf9f7]">
      <div className="sticky top-0 z-50 bg-[#faf9f7]/90 backdrop-blur-md px-4 pt-4 pb-2 border-b border-gray-100">
        <header className="text-center py-3">
          <h1 className="font-display text-3xl font-extrabold gradient-text">
            {showKingSection ? "👑 Vote for King" : showQueenSection ? "👑 Vote for Queen" : "👑 King & Queen"}
          </h1>
          <p className="text-gray-400 mt-1 text-sm font-medium">
            {showKingSection ? "Choose your King ♔" : showQueenSection ? "Now choose your Queen ♕" : "Vote for your favorites ✨"}
          </p>
        </header>

        {!votingClosed && !showComplete && (
          <div className="mb-2">
            <input
              type="search"
              placeholder={
                showKingSection
                  ? "🔍 Search King by name..."
                  : "🔍 Search Queen by name..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        {votingClosed ? (
          <div className="text-center py-12 rounded-2xl bg-white border border-gray-100 card-shadow">
            <span className="text-4xl mb-4 block">🔒</span>
            <p className="text-gray-700 text-lg font-semibold">Voting is currently closed</p>
            <p className="text-gray-400 text-sm mt-2">
              Wait for the admin to start the session
            </p>
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
                        disabled={votingClosed || kingVoted !== null}
                        voted={kingVoted === c.id}
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
                        disabled={votingClosed || queenVoted !== null}
                        voted={queenVoted === c.id}
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
