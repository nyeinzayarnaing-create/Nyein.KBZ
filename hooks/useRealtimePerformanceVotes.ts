"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PerformanceVoteCount, PerformanceGroup } from "@/types";

export function useRealtimePerformanceVotes(groups: PerformanceGroup[], refreshKey = 0): PerformanceVoteCount[] {
    const [voteCounts, setVoteCounts] = useState<PerformanceVoteCount[]>([]);

    useEffect(() => {
        async function fetchInitialVotes() {
            const { data: votes } = await supabase.from("performance_votes").select("group_id");
            const counts: Record<string, number> = {};
            groups.forEach((g) => (counts[g.id] = 0));
            votes?.forEach((v) => {
                counts[v.group_id] = (counts[v.group_id] ?? 0) + 1;
            });
            setVoteCounts(
                groups.map((g) => ({
                    group_id: g.id,
                    name: g.name,
                    photo_url: g.photo_url,
                    vote_count: counts[g.id] ?? 0,
                }))
            );
        }

        if (groups.length > 0) {
            fetchInitialVotes();
        }
    }, [groups, refreshKey]);

    useEffect(() => {
        if (groups.length === 0) return;

        const channel = supabase
            .channel("perf-votes-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "performance_votes" },
                async () => {
                    const { data: votes } = await supabase.from("performance_votes").select("group_id");
                    const counts: Record<string, number> = {};
                    groups.forEach((g) => (counts[g.id] = 0));
                    votes?.forEach((v) => {
                        counts[v.group_id] = (counts[v.group_id] ?? 0) + 1;
                    });
                    setVoteCounts(
                        groups.map((g) => ({
                            group_id: g.id,
                            name: g.name,
                            photo_url: g.photo_url,
                            vote_count: counts[g.id] ?? 0,
                        }))
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groups]);

    return voteCounts;
}
