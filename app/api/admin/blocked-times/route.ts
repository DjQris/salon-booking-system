import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { addBlockedTime, deleteBlockedTime, listBlockedTimes } from "@/lib/db";
import { timeToMinutes } from "@/lib/time";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const blockedTimes = await listBlockedTimes();

  return NextResponse.json({ blockedTimes });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const date = String(body.date ?? "");
  const startTime = body.startTime ? String(body.startTime) : null;
  const endTime = body.endTime ? String(body.endTime) : null;
  const reason = String(body.reason ?? "Unavailable").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Choose a valid date." }, { status: 400 });
  }

  if ((startTime && !endTime) || (!startTime && endTime)) {
    return NextResponse.json({ error: "Provide both start and end time, or neither for a full-day block." }, { status: 400 });
  }

  if (startTime && endTime && timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    return NextResponse.json({ error: "Choose a valid time range." }, { status: 400 });
  }

  const blockedTime = await addBlockedTime({
    date,
    startTime,
    endTime,
    reason
  });

  return NextResponse.json({ blockedTime });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id") ?? "";
  await deleteBlockedTime(id);

  return NextResponse.json({ ok: true });
}
