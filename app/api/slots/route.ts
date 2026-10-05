import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/booking";
import { getAppointmentByToken } from "@/lib/db";

export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const date = request.nextUrl.searchParams.get("date");
  const token = request.nextUrl.searchParams.get("token");

  if (!serviceId || !date) {
    return NextResponse.json({ error: "Service and date are required." }, { status: 400 });
  }

  const appointment = token ? await getAppointmentByToken(token) : null;
  const slots = await getAvailableSlots(serviceId, date, appointment?.id);

  return NextResponse.json({ slots });
}
