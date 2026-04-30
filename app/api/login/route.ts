import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  const token = await signToken(username);
  const cookieStore = await cookies();
  cookieStore.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: "/",
  });

  return NextResponse.json({ success: true });
}
