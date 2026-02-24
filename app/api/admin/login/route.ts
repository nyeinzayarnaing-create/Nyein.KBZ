import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "kq_admin_auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body as { password?: string };

    const expectedPassword = process.env.ADMIN_PASSWORD || "changeme";

    if (!password || password !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid passcode" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: COOKIE_NAME,
      value: "1",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to login" },
      { status: 500 }
    );
  }
}

