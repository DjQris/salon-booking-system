import { NextRequest, NextResponse } from "next/server";
import { appointmentStatuses } from "@/lib/booking";
import { isAdminRequest } from "@/lib/auth";
import { listAppointments, updateAppointmentStatus } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const date = request.nextUrl.searchParams.get("date");

  const appointments = await listAppointments({
    status: status ?? undefined,
    date: date ?? undefined
  });

  return NextResponse.json({ appointments });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id ?? "");
  const status = String(body.status ?? "");
  const allowed = [...appointmentStatuses];

  if (!allowed.includes(status as (typeof appointmentStatuses)[number])) {
    return NextResponse.json({ error: "Choose a valid status." }, { status: 400 });
  }

  const appointment = await updateAppointmentStatus(id, status);

  return NextResponse.json({ appointment });
}
