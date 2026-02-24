import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export async function POST() {
  try {
    const supabase = createAdminClient();

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

    // Reset winners_revealed so admin returns to dashboard with leaderboard
    await supabase
      .from("settings")
      .update({
        winners_revealed: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", SETTINGS_ID);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reset failed" },
      { status: 500 }
    );
  }
}
