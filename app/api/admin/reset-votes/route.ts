import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type || "all";
    const supabase = createAdminClient();

    if (type === "all" || type === "main") {
      const { data: votes, error: fetchError } = await supabase
        .from("votes")
        .select("id");

      if (fetchError) {
        return NextResponse.json(
          { error: `Fetch failed: ${fetchError.message}`, code: fetchError.code },
          { status: 500 }
        );
      }

      if (votes?.length) {
        const ids = votes.map((v) => v.id);
        for (let i = 0; i < ids.length; i += 100) {
          const { error } = await supabase.from("votes").delete().in("id", ids.slice(i, i + 100));
          if (error) {
            return NextResponse.json(
              { error: `Delete failed: ${error.message}`, code: error.code },
              { status: 500 }
            );
          }
        }
      }
    }

    if (type === "all" || type === "performance") {
      const { data: perfVotes, error: perfFetchError } = await supabase
        .from("performance_votes")
        .select("id");

      if (!perfFetchError && perfVotes?.length) {
        const ids = perfVotes.map((v) => v.id);
        for (let i = 0; i < ids.length; i += 100) {
          await supabase.from("performance_votes").delete().in("id", ids.slice(i, i + 100));
        }
      }
    }

    const { data: currentSettings } = await supabase.from("settings").select("*").eq("id", SETTINGS_ID).single();

    // Reset winners_revealed depending on type
    const updates: any = { updated_at: new Date().toISOString() };
    if (type === "all" || type === "main") updates.winners_revealed = false;
    if (type === "all" || type === "performance") updates.performance_winners_revealed = false;

    await supabase
      .from("settings")
      .update(updates)
      .eq("id", SETTINGS_ID);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reset failed" },
      { status: 500 }
    );
  }
}
