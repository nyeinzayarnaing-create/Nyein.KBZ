import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

// GET - Fetch all performance groups
export async function GET() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("performance_groups")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Fetch performance groups error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ groups: data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST - Create a new performance group
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, photo_url } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();
        const { data: inserted, error } = await supabase
            .from("performance_groups")
            .insert({
                name,
                photo_url: photo_url || null,
            })
            .select();

        if (error) {
            console.error("Create performance group error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!inserted || inserted.length === 0) {
            console.error("Create performance group failed: No rows returned");
            return NextResponse.json({ error: "No data returned after insert. Check RLS policies." }, { status: 500 });
        }

        return NextResponse.json({ group: inserted[0] }, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PUT - Update a performance group
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, photo_url } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Performance Group ID is required" },
                { status: 400 }
            );
        }

        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (photo_url !== undefined) updates.photo_url = photo_url || null;

        const supabase = createAdminClient();
        const { data: updated, error } = await supabase
            .from("performance_groups")
            .update(updates)
            .eq("id", id)
            .select();

        if (error) {
            console.error("Update performance group error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!updated || updated.length === 0) {
            console.error("Update performance group failed: Row not found or not affected", { id });
            return NextResponse.json({ error: "Performance group not found or no changes made" }, { status: 404 });
        }

        return NextResponse.json({ group: updated[0] });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE - Delete a performance group
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Performance Group ID is required" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();
        const { error } = await supabase.from("performance_groups").delete().eq("id", id);

        if (error) {
            console.error("Delete performance group error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
