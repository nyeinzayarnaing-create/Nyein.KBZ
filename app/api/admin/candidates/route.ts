import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

// GET - Fetch all candidates
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ candidates: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create a new candidate
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, photo_url, gender, group_name } = body;

    if (!name || !gender) {
      return NextResponse.json(
        { error: "Name and gender (king/queen) are required" },
        { status: 400 }
      );
    }

    if (!["king", "queen"].includes(gender)) {
      return NextResponse.json(
        { error: "Gender must be 'king' or 'queen'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("candidates")
      .insert({
        name,
        photo_url: photo_url || null,
        gender,
        group_name: group_name || "",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ candidate: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Update a candidate
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, photo_url, gender, group_name } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Candidate ID is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (photo_url !== undefined) updates.photo_url = photo_url || null;
    if (gender !== undefined) {
      if (!["king", "queen"].includes(gender)) {
        return NextResponse.json(
          { error: "Gender must be 'king' or 'queen'" },
          { status: 400 }
        );
      }
      updates.gender = gender;
    }
    if (group_name !== undefined) updates.group_name = group_name;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("candidates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ candidate: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Delete a candidate
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Candidate ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("candidates").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
