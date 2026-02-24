"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { VoteCount, Candidate } from "@/types";

export function useRealtimeVotes(candidates: Candidate[], refreshKey = 0): VoteCount[] {
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);

  useEffect(() => {
    async function fetchInitialVotes() {
      const { data: votes } = await supabase.from("votes").select("candidate_id");
      const counts: Record<string, number> = {};
      candidates.forEach((c) => (counts[c.id] = 0));
      votes?.forEach((v) => {
        counts[v.candidate_id] = (counts[v.candidate_id] ?? 0) + 1;
      });
      setVoteCounts(
        candidates.map((c) => ({
          candidate_id: c.id,
          name: c.name,
          photo_url: c.photo_url,
          gender: c.gender,
          group_name: c.group_name || "",
          vote_count: counts[c.id] ?? 0,
        }))
      );
    }

    if (candidates.length > 0) {
      fetchInitialVotes();
    }
  }, [candidates, refreshKey]);

  useEffect(() => {
    if (candidates.length === 0) return;

    const channel = supabase
      .channel("votes-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        async () => {
          const { data: votes } = await supabase.from("votes").select("candidate_id");
          const counts: Record<string, number> = {};
          candidates.forEach((c) => (counts[c.id] = 0));
          votes?.forEach((v) => {
            counts[v.candidate_id] = (counts[v.candidate_id] ?? 0) + 1;
          });
          setVoteCounts(
            candidates.map((c) => ({
              candidate_id: c.id,
              name: c.name,
              photo_url: c.photo_url,
              gender: c.gender,
              group_name: c.group_name || "",
              vote_count: counts[c.id] ?? 0,
            }))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [candidates]);

  return voteCounts;
}
