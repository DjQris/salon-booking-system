import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSession, hashPassword } from "@/lib/auth";
import { findAdminByEmail } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const admin = await findAdminByEmail(email);

  if (!admin || admin.passwordHash !== hashPassword(password)) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }

  const session = await createAdminSession(admin.id);
  const response = NextResponse.json({ ok: true });

  response.cookies.set(ADMIN_SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    expires: session.expiresAt,
    path: "/"
  });

  return response;
}
