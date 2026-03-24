import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, timerSeconds } = body;

    const supabase = createAdminClient();

    if (action === "start") {
      const seconds = Math.min(3600, Math.max(60, Number(timerSeconds) || 300));
      const timerEndAt = new Date(Date.now() + seconds * 1000).toISOString();
      const { error } = await supabase
        .from("settings")
        .update({
          timer_seconds: seconds,
          timer_end_at: timerEndAt,
          voting_active: true,
          winners_revealed: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", SETTINGS_ID);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "stop") {
      const { error } = await supabase
        .from("settings")
        .update({
          voting_active: false,
          timer_end_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", SETTINGS_ID);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "reset") {
      const { error } = await supabase.rpc("reset_all_votes");
      if (error) {
        const { error: delError } = await supabase
          .from("votes")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (delError) throw delError;
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
