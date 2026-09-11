import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { listNotifications } from "@/lib/db";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const notifications = await listNotifications();

  return NextResponse.json({ notifications });
}
