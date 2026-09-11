import { NextRequest, NextResponse } from "next/server";
import { assertSlotAvailable, buildNotificationDrafts, createManageToken } from "@/lib/booking";
import { createAppointment, getServiceById } from "@/lib/db";
import { isValidEmail, isValidPhone, normalizeOptional } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customerName = String(body.customerName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = normalizeOptional(body.email);
    const notes = normalizeOptional(body.notes);
    const serviceId = String(body.serviceId ?? "");
    const date = String(body.date ?? "");
    const startTime = String(body.startTime ?? "");

    if (!customerName) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const service = await getServiceById(serviceId);

    if (!service || !service.active) {
      return NextResponse.json({ error: "Choose an active service." }, { status: 400 });
    }

    const slot = await assertSlotAvailable(serviceId, date, startTime);
    const manageToken = createManageToken();

    const appointment = await createAppointment({
      customerName,
      phone,
      email,
      notes,
      serviceId,
      serviceArea: service.serviceArea,
      date,
      startTime,
      endTime: slot.endTime,
      manageToken,
      notifications: buildNotificationDrafts({
        customerName,
        phone,
        email,
        serviceName: service.name,
        date,
        startTime,
        endTime: slot.endTime
      })
    });

    return NextResponse.json({
      appointment: { ...appointment, service },
      manageUrl: `/manage?token=${appointment.manageToken}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create appointment." },
      { status: 400 }
    );
  }
}
