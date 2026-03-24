"use client";

import { useEffect, useState, useCallback } from "react";
import { getVoterId, getKingVoted, getQueenVoted, clearVotedState } from "@/lib/voter";
import { supabase } from "@/lib/supabase";

export type VoterState = {
  voterId: string | null;
  kingVoted: string | null;
  queenVoted: string | null;
  isHydrated: boolean;
  refetch: () => void;
};

export function useVoterState(): VoterState {
  const [state, setState] = useState<Omit<VoterState, "refetch" | "isHydrated">>({
    voterId: getVoterId(),
    kingVoted: getKingVoted(),
    queenVoted: getQueenVoted(),
  });
  const [isHydrated, setIsHydrated] = useState(false);

  const hydrate = useCallback(() => {
    const voterId = getVoterId();
    let kingVoted = getKingVoted();
    let queenVoted = getQueenVoted();

    async function hydrateFromDb() {
      if (!supabase || !voterId) {
        setState({ voterId, kingVoted, queenVoted });
        return;
      }
      const { data } = await supabase
        .from("votes")
        .select("candidate_id")
        .eq("voter_id", voterId);

      if (data?.length) {
        const candidateIds = data.map((v) => v.candidate_id);
        const { data: cands } = await supabase
          .from("candidates")
          .select("id, gender")
          .in("id", candidateIds);
        cands?.forEach((c: { id: string; gender: string }) => {
          if (c.gender === "king") kingVoted = c.id;
          if (c.gender === "queen") queenVoted = c.id;
        });
      } else {
        clearVotedState();
        kingVoted = null;
        queenVoted = null;
      }
      setState({ voterId, kingVoted, queenVoted });
      setIsHydrated(true);
    }

    hydrateFromDb();
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("voter-votes-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => hydrate()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [hydrate]);

  return { ...state, isHydrated, refetch: hydrate };
}
