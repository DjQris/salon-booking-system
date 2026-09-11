import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import initSqlJs, { Database } from "sql.js";
import { hashPassword } from "@/lib/auth-crypto";

export type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  serviceArea: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Appointment = {
  id: string;
  customerName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceArea: string;
  manageToken: string;
  serviceId: string;
  createdAt: string;
  updatedAt: string;
  service?: Service;
};

export type BlockedTime = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
  createdAt: string;
};

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

export type NotificationRecord = {
  id: string;
  appointmentId: string | null;
  channel: string;
  purpose: string;
  status: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "salon.sqlite");

let dbPromise: Promise<Database> | null = null;
let writeLock = Promise.resolve();

function id(prefix: string) {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}

function now() {
  return new Date().toISOString();
}

function bool(value: unknown) {
  return Boolean(Number(value));
}

function rows<T>(db: Database, sql: string, params: unknown[] = []) {
  const stmt = db.prepare(sql);
  const result: T[] = [];
  stmt.bind(params);

  while (stmt.step()) {
    result.push(stmt.getAsObject() as T);
  }

  stmt.free();
  return result;
}

function one<T>(db: Database, sql: string, params: unknown[] = []) {
  return rows<T>(db, sql, params)[0] ?? null;
}

function mapService(row: Record<string, unknown>): Service {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    durationMinutes: Number(row.duration_minutes),
    serviceArea: String(row.service_area),
    active: bool(row.active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapAppointment(row: Record<string, unknown>, service?: Service): Appointment {
  return {
    id: String(row.id),
    customerName: String(row.customer_name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : null,
    notes: row.notes ? String(row.notes) : null,
    date: String(row.date),
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    status: String(row.status),
    serviceArea: String(row.service_area),
    manageToken: String(row.manage_token),
    serviceId: String(row.service_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    service
  };
}

function mapBlocked(row: Record<string, unknown>): BlockedTime {
  return {
    id: String(row.id),
    date: String(row.date),
    startTime: row.start_time ? String(row.start_time) : null,
    endTime: row.end_time ? String(row.end_time) : null,
    reason: String(row.reason),
    createdAt: String(row.created_at)
  };
}

function mapNotification(row: Record<string, unknown>): NotificationRecord {
  return {
    id: String(row.id),
    appointmentId: row.appointment_id ? String(row.appointment_id) : null,
    channel: String(row.channel),
    purpose: String(row.purpose),
    status: String(row.status),
    recipient: String(row.recipient),
    subject: String(row.subject),
    body: String(row.body),
    scheduledFor: row.scheduled_for ? String(row.scheduled_for) : null,
    sentAt: row.sent_at ? String(row.sent_at) : null,
    createdAt: String(row.created_at)
  };
}

async function persist(db: Database) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, Buffer.from(db.export()));
}

async function createDatabase() {
  await fs.mkdir(dataDir, { recursive: true });
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), "node_modules", "sql.js", "dist", file)
  });

  try {
    const existing = await fs.readFile(dbPath);
    return new SQL.Database(existing);
  } catch {
    const db = new SQL.Database();
    seedSchema(db);
    await persist(db);
    return db;
  }
}

export async function getDatabase() {
  dbPromise ??= createDatabase();
  return dbPromise;
}

export async function readDb<T>(fn: (db: Database) => T) {
  await writeLock;
  const db = await getDatabase();
  return fn(db);
}

export async function writeDb<T>(fn: (db: Database) => T) {
  const next = writeLock.then(async () => {
    const db = await getDatabase();
    const value = fn(db);
    await persist(db);
    return value;
  });

  writeLock = next.then(
    () => undefined,
    () => undefined
  );

  return next;
}

function seedSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      service_area TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      notes TEXT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      service_area TEXT NOT NULL,
      manage_token TEXT NOT NULL UNIQUE,
      service_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS appointments_slot_idx ON appointments(date, service_area, status);

    CREATE TABLE IF NOT EXISTS availability_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER NOT NULL UNIQUE,
      open_time TEXT NOT NULL,
      close_time TEXT NOT NULL,
      is_closed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS blocked_times (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS blocked_times_date_idx ON blocked_times(date);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      appointment_id TEXT,
      channel TEXT NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'MOCKED',
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      scheduled_for TEXT,
      sent_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS notifications_appointment_idx ON notifications(appointment_id);

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      admin_id TEXT NOT NULL
    );
  `);

  const seededAt = now();
  const services = [
    ["Hair Washing", "Refreshing wash, scalp rinse, and towel dry.", 30, "wash-care"],
    ["Adult Barbing", "Classic adult haircut with clean finish.", 45, "barbing"],
    ["Children's Cut", "Gentle haircut service for children.", 30, "barbing"],
    ["Shaving", "Face shave and shape-up.", 30, "barbing"],
    ["Barbing + Shaving", "Complete haircut and shaving appointment.", 60, "barbing"],
    ["Plaiting", "Neat plaiting appointment for protective styling.", 120, "braiding"],
    ["Conditioning Treatment", "Deep conditioning and hair care treatment.", 60, "wash-care"],
    ["Wash + Conditioning", "Wash followed by conditioning treatment.", 75, "wash-care"]
  ];

  for (const service of services) {
    db.run(
      `INSERT OR IGNORE INTO services
       (id, name, description, duration_minutes, service_area, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [id("svc"), ...service, seededAt, seededAt]
    );
  }

  const weeklyHours = [
    [0, "10:00", "16:00", 1],
    [1, "09:00", "18:00", 0],
    [2, "09:00", "18:00", 0],
    [3, "09:00", "18:00", 0],
    [4, "09:00", "18:00", 0],
    [5, "09:00", "19:00", 0],
    [6, "10:00", "17:00", 0]
  ];

  for (const rule of weeklyHours) {
    db.run(
      `INSERT OR IGNORE INTO availability_rules (day_of_week, open_time, close_time, is_closed)
       VALUES (?, ?, ?, ?)`,
      rule
    );
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@salon.test").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  db.run(
    `INSERT OR IGNORE INTO admin_users (id, email, password_hash, created_at)
     VALUES (?, ?, ?, ?)`,
    [id("adm"), adminEmail, hashPassword(adminPassword), seededAt]
  );
}

export async function resetDatabaseFile() {
  dbPromise = null;
  await fs.rm(dbPath, { force: true });
  await getDatabase();
}

export async function getActiveServices() {
  return readDb((db) =>
    rows<Record<string, unknown>>(
      db,
      "SELECT * FROM services WHERE active = 1 ORDER BY service_area ASC, name ASC"
    ).map(mapService)
  );
}

export async function getAllServices() {
  return readDb((db) =>
    rows<Record<string, unknown>>(
      db,
      "SELECT * FROM services ORDER BY active DESC, service_area ASC, name ASC"
    ).map(mapService)
  );
}

export async function getServiceById(serviceId: string) {
  return readDb((db) => {
    const row = one<Record<string, unknown>>(db, "SELECT * FROM services WHERE id = ?", [serviceId]);
    return row ? mapService(row) : null;
  });
}

export async function getAvailabilityRule(dayOfWeek: number) {
  return readDb((db) =>
    one<{ day_of_week: number; open_time: string; close_time: string; is_closed: number }>(
      db,
      "SELECT * FROM availability_rules WHERE day_of_week = ?",
      [dayOfWeek]
    )
  );
}

export async function getBlockedTimesByDate(date: string) {
  return readDb((db) =>
    rows<Record<string, unknown>>(db, "SELECT * FROM blocked_times WHERE date = ?", [date]).map(mapBlocked)
  );
}

export async function getConfirmedAppointmentsByDateAndArea(date: string, serviceArea: string) {
  return readDb((db) =>
    rows<Record<string, unknown>>(
      db,
      "SELECT * FROM appointments WHERE date = ? AND service_area = ? AND status = 'CONFIRMED'",
      [date, serviceArea]
    ).map((row) => mapAppointment(row))
  );
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
  return writeDb((db) => {
    const appointmentId = id("apt");
    const timestamp = now();

    db.run(
      `INSERT INTO appointments
       (id, customer_name, phone, email, notes, date, start_time, end_time, status, service_area, manage_token, service_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?, ?, ?)`,
      [
        appointmentId,
        input.customerName,
        input.phone,
        input.email,
        input.notes,
        input.date,
        input.startTime,
        input.endTime,
        input.serviceArea,
        input.manageToken,
        input.serviceId,
        timestamp,
        timestamp
      ]
    );

    insertNotifications(db, input.notifications.map((notification) => ({ ...notification, appointmentId })));
    const row = one<Record<string, unknown>>(db, "SELECT * FROM appointments WHERE id = ?", [appointmentId]);
    return mapAppointment(row!);
  });
}

export async function getAppointmentByToken(token: string) {
  return readDb((db) => {
    const row = one<Record<string, unknown>>(db, "SELECT * FROM appointments WHERE manage_token = ?", [token]);
    if (!row) return null;
    const serviceRow = one<Record<string, unknown>>(db, "SELECT * FROM services WHERE id = ?", [row.service_id]);
    return mapAppointment(row, serviceRow ? mapService(serviceRow) : undefined);
  });
}

export async function updateAppointmentStatus(idValue: string, status: string) {
  return writeDb((db) => {
    db.run("UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?", [status, now(), idValue]);
    const row = one<Record<string, unknown>>(db, "SELECT * FROM appointments WHERE id = ?", [idValue]);
    if (!row) return null;
    const serviceRow = one<Record<string, unknown>>(db, "SELECT * FROM services WHERE id = ?", [row.service_id]);
    return mapAppointment(row, serviceRow ? mapService(serviceRow) : undefined);
  });
}

export async function rescheduleAppointment(idValue: string, date: string, startTime: string, endTime: string, notifications: NotificationDraft[]) {
  return writeDb((db) => {
    db.run("UPDATE appointments SET date = ?, start_time = ?, end_time = ?, updated_at = ? WHERE id = ?", [
      date,
      startTime,
      endTime,
      now(),
      idValue
    ]);
    insertNotifications(db, notifications);
    const row = one<Record<string, unknown>>(db, "SELECT * FROM appointments WHERE id = ?", [idValue]);
    if (!row) return null;
    const serviceRow = one<Record<string, unknown>>(db, "SELECT * FROM services WHERE id = ?", [row.service_id]);
    return mapAppointment(row, serviceRow ? mapService(serviceRow) : undefined);
  });
}

export async function listAppointments(filters: { status?: string; date?: string }) {
  return readDb((db) => {
    const where = [];
    const params: string[] = [];

    if (filters.status && filters.status !== "ALL") {
      where.push("a.status = ?");
      params.push(filters.status);
    }

    if (filters.date) {
      where.push("a.date = ?");
      params.push(filters.date);
    }

    const sql = `
      SELECT a.*, s.id AS service_id_join, s.name AS service_name, s.description AS service_description,
        s.duration_minutes AS service_duration_minutes, s.service_area AS service_service_area,
        s.active AS service_active, s.created_at AS service_created_at, s.updated_at AS service_updated_at
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY a.date ASC, a.start_time ASC
    `;

    return rows<Record<string, unknown>>(db, sql, params).map((row) =>
      mapAppointment(row, {
        id: String(row.service_id_join),
        name: String(row.service_name),
        description: String(row.service_description),
        durationMinutes: Number(row.service_duration_minutes),
        serviceArea: String(row.service_service_area),
        active: bool(row.service_active),
        createdAt: String(row.service_created_at),
        updatedAt: String(row.service_updated_at)
      })
    );
  });
}

export async function saveService(input: Omit<Service, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  return writeDb((db) => {
    const timestamp = now();
    const serviceId = input.id ?? id("svc");

    if (input.id) {
      db.run(
        `UPDATE services
         SET name = ?, description = ?, duration_minutes = ?, service_area = ?, active = ?, updated_at = ?
         WHERE id = ?`,
        [
          input.name,
          input.description,
          input.durationMinutes,
          input.serviceArea,
          input.active ? 1 : 0,
          timestamp,
          serviceId
        ]
      );
    } else {
      db.run(
        `INSERT INTO services (id, name, description, duration_minutes, service_area, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          serviceId,
          input.name,
          input.description,
          input.durationMinutes,
          input.serviceArea,
          input.active ? 1 : 0,
          timestamp,
          timestamp
        ]
      );
    }

    const row = one<Record<string, unknown>>(db, "SELECT * FROM services WHERE id = ?", [serviceId]);
    return row ? mapService(row) : null;
  });
}

export async function listBlockedTimes() {
  return readDb((db) =>
    rows<Record<string, unknown>>(db, "SELECT * FROM blocked_times ORDER BY date ASC, start_time ASC").map(mapBlocked)
  );
}

export async function addBlockedTime(input: {
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
}) {
  return writeDb((db) => {
    const blockId = id("blk");
    db.run(
      "INSERT INTO blocked_times (id, date, start_time, end_time, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [blockId, input.date, input.startTime, input.endTime, input.reason, now()]
    );
    const row = one<Record<string, unknown>>(db, "SELECT * FROM blocked_times WHERE id = ?", [blockId]);
    return row ? mapBlocked(row) : null;
  });
}

export async function deleteBlockedTime(idValue: string) {
  return writeDb((db) => {
    db.run("DELETE FROM blocked_times WHERE id = ?", [idValue]);
  });
}

function insertNotifications(db: Database, notifications: NotificationDraft[]) {
  for (const notification of notifications) {
    db.run(
      `INSERT INTO notifications
       (id, appointment_id, channel, purpose, status, recipient, subject, body, scheduled_for, sent_at, created_at)
       VALUES (?, ?, ?, ?, 'MOCKED', ?, ?, ?, ?, ?, ?)`,
      [
        id("ntf"),
        notification.appointmentId ?? null,
        notification.channel,
        notification.purpose,
        notification.recipient,
        notification.subject,
        notification.body,
        notification.scheduledFor?.toISOString() ?? null,
        notification.sentAt?.toISOString() ?? null,
        now()
      ]
    );
  }
}

export async function addNotifications(notifications: NotificationDraft[]) {
  return writeDb((db) => insertNotifications(db, notifications));
}

export async function listNotifications() {
  return readDb((db) =>
    rows<Record<string, unknown>>(db, "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 80").map(mapNotification)
  );
}

export async function findAdminByEmail(email: string) {
  return readDb((db) => {
    const row = one<Record<string, unknown>>(db, "SELECT * FROM admin_users WHERE email = ?", [email]);
    return row
      ? {
          id: String(row.id),
          email: String(row.email),
          passwordHash: String(row.password_hash),
          createdAt: String(row.created_at)
        }
      : null;
  });
}

export async function createAdminSessionRecord(adminId: string, token: string, expiresAt: Date) {
  return writeDb((db) => {
    db.run("INSERT INTO admin_sessions (id, token, expires_at, created_at, admin_id) VALUES (?, ?, ?, ?, ?)", [
      id("ses"),
      token,
      expiresAt.toISOString(),
      now(),
      adminId
    ]);
  });
}

export async function getAdminBySessionToken(token: string) {
  return readDb((db) => {
    const row = one<Record<string, unknown>>(
      db,
      `SELECT u.*
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.admin_id
       WHERE s.token = ? AND s.expires_at > ?`,
      [token, now()]
    );
    return row
      ? {
          id: String(row.id),
          email: String(row.email),
          passwordHash: String(row.password_hash),
          createdAt: String(row.created_at)
        }
      : null;
  });
}
