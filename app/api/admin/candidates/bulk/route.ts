import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

// POST - Create multiple candidates
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { candidates } = body;

        if (!Array.isArray(candidates) || candidates.length === 0) {
            return NextResponse.json(
                { error: "A valid array of candidates is required" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();
        const { data: inserted, error } = await supabase
            .from("candidates")
            .insert(candidates)
            .select();

        if (error) {
            console.error("Bulk create candidates error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!inserted || inserted.length === 0) {
            console.error("Bulk create candidates failed: No rows returned");
            return NextResponse.json({ error: "No data returned after insert. Check RLS policies." }, { status: 500 });
        }

        return NextResponse.json({ candidates: inserted }, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
