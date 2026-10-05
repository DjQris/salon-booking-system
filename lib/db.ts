import { Prisma } from "@prisma/client";
import type { Service } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

export type NotificationDraft = {
  appointmentId?: string;
  channel: string;
  purpose: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledFor?: Date;
  sentAt?: Date;
};

export const getActiveServices = () =>
  getPrisma().service.findMany({
    where: { active: true },
    orderBy: [{ serviceArea: "asc" }, { name: "asc" }],
  });
export const getAllServices = () =>
  getPrisma().service.findMany({
    orderBy: [{ active: "desc" }, { serviceArea: "asc" }, { name: "asc" }],
  });
export const getServiceById = (id: string) =>
  getPrisma().service.findUnique({ where: { id } });
export async function getAvailabilityRule(dayOfWeek: number) {
  const rule = await getPrisma().availabilityRule.findUnique({
    where: { dayOfWeek },
  });
  return (
    rule && {
      day_of_week: rule.dayOfWeek,
      open_time: rule.openTime,
      close_time: rule.closeTime,
      is_closed: rule.isClosed,
    }
  );
}
export const getBlockedTimesByDate = (date: string) =>
  getPrisma().blockedTime.findMany({ where: { date } });
export const getConfirmedAppointmentsByDateAndArea = (
  date: string,
  serviceArea: string,
) =>
  getPrisma().appointment.findMany({
    where: { date, serviceArea, status: "CONFIRMED" },
  });

// Recheck capacity in the write transaction so two requests cannot reserve the same area.
async function checkCapacity(
  tx: Prisma.TransactionClient,
  input: {
    date: string;
    startTime: string;
    endTime: string;
    serviceArea: string;
    serviceId: string;
  },
  excludeId?: string,
) {
  const service = await tx.service.findUnique({
    where: { id: input.serviceId },
  });
  if (!service?.active) throw new Error("Choose an active service.");
  const taken = await tx.appointment.findFirst({
    where: {
      date: input.date,
      serviceArea: input.serviceArea,
      status: "CONFIRMED",
      startTime: { lt: input.endTime },
      endTime: { gt: input.startTime },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  const blocked = await tx.blockedTime.findFirst({
    where: {
      date: input.date,
      OR: [
        { startTime: null },
        { endTime: null },
        { startTime: { lt: input.endTime }, endTime: { gt: input.startTime } },
      ],
    },
  });
  if (taken || blocked)
    throw new Error("That appointment time is no longer available.");
}

export async function createAppointment(input: {
  customerName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  serviceId: string;
  serviceArea: string;
  date: string;
  startTime: string;
  endTime: string;
  manageToken: string;
  notifications: NotificationDraft[];
}) {
  return getPrisma().$transaction(
    async (tx) => {
      await checkCapacity(tx, input);
      const { notifications, ...data } = input;
      const appointment = await tx.appointment.create({ data });
      await tx.notification.createMany({
        data: notifications.map((n) => ({
          ...n,
          appointmentId: appointment.id,
        })),
      });
      return appointment;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export const getAppointmentByToken = (manageToken: string) =>
  getPrisma().appointment.findUnique({
    where: { manageToken },
    include: { service: true },
  });
export async function updateAppointmentStatus(id: string, status: string) {
  return getPrisma().$transaction(
    async (tx) => {
      const appointment = await tx.appointment.findUnique({ where: { id } });
      if (!appointment) return null;
      if (status === "CONFIRMED") await checkCapacity(tx, appointment, id);
      if (status !== "CONFIRMED")
        await tx.notification.deleteMany({
          where: { appointmentId: id, sentAt: null },
        });
      return tx.appointment.update({
        where: { id },
        data: { status },
        include: { service: true },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function rescheduleAppointment(
  id: string,
  date: string,
  startTime: string,
  endTime: string,
  notifications: NotificationDraft[],
) {
  return getPrisma().$transaction(
    async (tx) => {
      const appointment = await tx.appointment.findUnique({ where: { id } });
      if (!appointment || appointment.status !== "CONFIRMED")
        throw new Error("Only confirmed appointments can be changed.");
      await checkCapacity(tx, { ...appointment, date, startTime, endTime }, id);
      await tx.notification.deleteMany({
        where: { appointmentId: id, sentAt: null },
      });
      await tx.notification.createMany({
        data: notifications.map((n) => ({ ...n, appointmentId: id })),
      });
      return tx.appointment.update({
        where: { id },
        data: { date, startTime, endTime },
        include: { service: true },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export const listAppointments = (filters: { status?: string; date?: string }) =>
  getPrisma().appointment.findMany({
    where: {
      ...(filters.status && filters.status !== "ALL"
        ? { status: filters.status }
        : {}),
      ...(filters.date ? { date: filters.date } : {}),
    },
    include: { service: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
export async function saveService(
  input: Omit<Service, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const { id, ...data } = input;
  return id
    ? getPrisma().service.update({ where: { id }, data })
    : getPrisma().service.create({ data });
}
export const listBlockedTimes = () =>
  getPrisma().blockedTime.findMany({
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
export const addBlockedTime = (data: {
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
}) => getPrisma().blockedTime.create({ data });
export const deleteBlockedTime = (id: string) =>
  getPrisma().blockedTime.delete({ where: { id } });
export const addNotifications = (notifications: NotificationDraft[]) =>
  getPrisma().notification.createMany({ data: notifications });
export const listNotifications = () =>
  getPrisma().notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
  });
export const findAdminByEmail = (email: string) =>
  getPrisma().adminUser.findUnique({ where: { email } });
export const createAdminSessionRecord = (
  adminId: string,
  token: string,
  expiresAt: Date,
) => getPrisma().adminSession.create({ data: { adminId, token, expiresAt } });
export async function getAdminBySessionToken(token: string) {
  const session = await getPrisma().adminSession.findUnique({
    where: { token },
    include: { admin: true },
  });
  return session && session.expiresAt > new Date() ? session.admin : null;
}
export const deleteAdminSession = (token: string) =>
  getPrisma().adminSession.deleteMany({ where: { token } });
