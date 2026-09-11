import { randomBytes } from "crypto";
import {
  getAvailabilityRule,
  getBlockedTimesByDate,
  getConfirmedAppointmentsByDateAndArea,
  getServiceById
} from "@/lib/db";
import { combineDateAndTime, isPastSlot, minutesToTime, overlaps, timeToMinutes } from "@/lib/time";

export type Slot = {
  startTime: string;
  endTime: string;
};

export const appointmentStatuses = ["CONFIRMED", "CANCELED", "COMPLETED", "NO_SHOW"] as const;
export const notificationPurposes = {
  confirmation: "CONFIRMATION",
  reminder24h: "REMINDER_24H",
  reminder2h: "REMINDER_2H",
  cancellation: "CANCELLATION",
  reschedule: "RESCHEDULE"
} as const;

export type NotificationPurpose = (typeof notificationPurposes)[keyof typeof notificationPurposes];
export type NotificationChannel = "EMAIL" | "SMS";

export function createManageToken() {
  return randomBytes(24).toString("hex");
}

export async function getAvailableSlots(
  serviceId: string,
  date: string,
  excludeAppointmentId?: string
): Promise<Slot[]> {
  const service = await getServiceById(serviceId);

  if (!service || !service.active || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return [];
  }

  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const rule = await getAvailabilityRule(dayOfWeek);

  if (!rule || Boolean(rule.is_closed)) {
    return [];
  }

  const [blockedTimes, appointments] = await Promise.all([
    getBlockedTimesByDate(date),
    getConfirmedAppointmentsByDateAndArea(date, service.serviceArea)
  ]);

  const slots: Slot[] = [];
  const open = timeToMinutes(rule.open_time);
  const close = timeToMinutes(rule.close_time);
  const step = 30;

  for (let start = open; start + service.durationMinutes <= close; start += step) {
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(start + service.durationMinutes);

    if (isPastSlot(date, startTime)) {
      continue;
    }

    const blocked = blockedTimes.some((block) => {
      if (!block.startTime || !block.endTime) {
        return true;
      }

      return overlaps(startTime, endTime, block.startTime, block.endTime);
    });

    const taken = appointments.some(
      (appointment) =>
        appointment.id !== excludeAppointmentId &&
        overlaps(startTime, endTime, appointment.startTime, appointment.endTime)
    );

    if (!blocked && !taken) {
      slots.push({ startTime, endTime });
    }
  }

  return slots;
}

export async function assertSlotAvailable(
  serviceId: string,
  date: string,
  startTime: string,
  excludeAppointmentId?: string
) {
  const slots = await getAvailableSlots(serviceId, date, excludeAppointmentId);
  const slot = slots.find((candidate) => candidate.startTime === startTime);

  if (!slot) {
    throw new Error("That appointment time is no longer available.");
  }

  return slot;
}

export function createAppointmentSummary(input: {
  customerName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  return `${input.customerName}, your ${input.serviceName} appointment is confirmed for ${input.date} from ${input.startTime} to ${input.endTime}.`;
}

export function buildNotificationDrafts(input: {
  appointmentId?: string;
  customerName: string;
  phone: string;
  email?: string | null;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose?: NotificationPurpose;
}) {
  const purpose = input.purpose ?? notificationPurposes.confirmation;
  const summary = createAppointmentSummary(input);
  const scheduledStart = combineDateAndTime(input.date, input.startTime);
  const channels = [
    input.email
      ? {
          channel: "EMAIL",
          recipient: input.email
        }
      : null,
    {
      channel: "SMS",
      recipient: input.phone
    }
  ].filter(Boolean) as Array<{ channel: NotificationChannel; recipient: string }>;

  return [
    ...channels.map((channel) => ({
      appointmentId: input.appointmentId,
      ...channel,
      purpose,
      subject: purpose === notificationPurposes.reschedule ? "Appointment rescheduled" : "Appointment confirmed",
      body: summary,
      sentAt: new Date()
    })),
    ...channels.flatMap((channel) => [
      {
        appointmentId: input.appointmentId,
        ...channel,
        purpose: notificationPurposes.reminder24h,
        subject: "Appointment reminder",
        body: `Reminder: ${summary}`,
        scheduledFor: new Date(scheduledStart.getTime() - 24 * 60 * 60 * 1000)
      },
      {
        appointmentId: input.appointmentId,
        ...channel,
        purpose: notificationPurposes.reminder2h,
        subject: "Appointment reminder",
        body: `Reminder: ${summary}`,
        scheduledFor: new Date(scheduledStart.getTime() - 2 * 60 * 60 * 1000)
      }
    ])
  ];
}
