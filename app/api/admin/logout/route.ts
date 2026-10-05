import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";
import { deleteAdminSession } from "@/lib/db";

export async function POST() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (token) await deleteAdminSession(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    expires: new Date(0),
    path: "/"
  });

  return response;
}
