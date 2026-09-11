import { NextRequest, NextResponse } from "next/server";
import { assertSlotAvailable, buildNotificationDrafts, notificationPurposes } from "@/lib/booking";
import {
  addNotifications,
  getAppointmentByToken,
  rescheduleAppointment,
  updateAppointmentStatus
} from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const appointment = await getAppointmentByToken(token);

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  return NextResponse.json({ appointment });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "");
    const action = String(body.action ?? "");

    const appointment = await getAppointmentByToken(token);

    if (!appointment || !appointment.service) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    if (appointment.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Only confirmed appointments can be changed." }, { status: 400 });
    }

    if (action === "cancel") {
      const updated = await updateAppointmentStatus(appointment.id, "CANCELED");
      const cancellationNotifications = [];

      if (appointment.email) {
        cancellationNotifications.push({
          appointmentId: appointment.id,
          channel: "EMAIL",
          purpose: notificationPurposes.cancellation,
          recipient: appointment.email,
          subject: "Appointment canceled",
          body: `Your ${appointment.service.name} appointment on ${appointment.date} at ${appointment.startTime} has been canceled.`,
          sentAt: new Date()
        });
      }

      cancellationNotifications.push({
        appointmentId: appointment.id,
        channel: "SMS",
        purpose: notificationPurposes.cancellation,
        recipient: appointment.phone,
        subject: "Appointment canceled",
        body: `Your ${appointment.service.name} appointment on ${appointment.date} at ${appointment.startTime} has been canceled.`,
        sentAt: new Date()
      });

      await addNotifications(cancellationNotifications);

      return NextResponse.json({ appointment: updated });
    }

    if (action === "reschedule") {
      const date = String(body.date ?? "");
      const startTime = String(body.startTime ?? "");
      const slot = await assertSlotAvailable(appointment.serviceId, date, startTime, appointment.id);

      const updated = await rescheduleAppointment(
        appointment.id,
        date,
        startTime,
        slot.endTime,
        buildNotificationDrafts({
          appointmentId: appointment.id,
          customerName: appointment.customerName,
          phone: appointment.phone,
          email: appointment.email,
          serviceName: appointment.service.name,
          date,
          startTime,
          endTime: slot.endTime,
          purpose: notificationPurposes.reschedule
        })
      );

      return NextResponse.json({ appointment: updated });
    }

    return NextResponse.json({ error: "Choose cancel or reschedule." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to manage appointment." },
      { status: 400 }
    );
  }
}
