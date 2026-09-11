"use client";

import { Ban, BellRing, CalendarDays, Edit3, LogOut, Plus, Scissors, Save } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Service = {
  id?: string;
  name: string;
  description: string;
  durationMinutes: number;
  serviceArea: string;
  active: boolean;
};

type Appointment = {
  id: string;
  customerName: string;
  phone: string;
  email?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  service: Service;
};

type BlockedTime = {
  id: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  reason: string;
};

type Notification = {
  id: string;
  channel: string;
  purpose: string;
  status: string;
  recipient: string;
  subject: string;
  createdAt: string;
  scheduledFor?: string | null;
};

const blankService: Service = {
  name: "",
  description: "",
  durationMinutes: 30,
  serviceArea: "barbing",
  active: true
};

export function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [serviceForm, setServiceForm] = useState<Service>(blankService);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [blockForm, setBlockForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: "",
    endTime: "",
    reason: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const appointmentSummary = useMemo(() => {
    const total = appointments.length;
    const confirmed = appointments.filter((appointment) => appointment.status === "CONFIRMED").length;
    const completed = appointments.filter((appointment) => appointment.status === "COMPLETED").length;
    return { total, confirmed, completed };
  }, [appointments]);

  async function loadAll() {
    setError("");
    const query = new URLSearchParams();
    if (statusFilter !== "ALL") query.set("status", statusFilter);
    if (dateFilter) query.set("date", dateFilter);

    const [appointmentsRes, servicesRes, blocksRes, notificationsRes] = await Promise.all([
      fetch(`/api/admin/appointments?${query.toString()}`),
      fetch("/api/admin/services"),
      fetch("/api/admin/blocked-times"),
      fetch("/api/admin/notifications")
    ]);

    if ([appointmentsRes, servicesRes, blocksRes, notificationsRes].some((response) => response.status === 401)) {
      window.location.href = "/admin/login";
      return;
    }

    const [appointmentsData, servicesData, blocksData, notificationsData] = await Promise.all([
      appointmentsRes.json(),
      servicesRes.json(),
      blocksRes.json(),
      notificationsRes.json()
    ]);

    setAppointments(appointmentsData.appointments ?? []);
    setServices(servicesData.services ?? []);
    setBlockedTimes(blocksData.blockedTimes ?? []);
    setNotifications(notificationsData.notifications ?? []);
  }

  useEffect(() => {
    loadAll().catch(() => setError("Admin data could not be loaded."));
  }, [statusFilter, dateFilter]);

  async function changeAppointmentStatus(id: string, status: string) {
    const response = await fetch("/api/admin/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });

    if (!response.ok) {
      setError("Appointment status could not be updated.");
      return;
    }

    await loadAll();
  }

  async function saveService(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/services", {
      method: serviceForm.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serviceForm)
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Service could not be saved.");
      return;
    }

    setMessage("Service saved.");
    setServiceForm(blankService);
    await loadAll();
  }

  async function addBlockedTime(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/blocked-times", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockForm)
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Blocked time could not be added.");
      return;
    }

    setMessage("Unavailable time added.");
    setBlockForm({ ...blockForm, startTime: "", endTime: "", reason: "" });
    await loadAll();
  }

  async function removeBlockedTime(id: string) {
    await fetch(`/api/admin/blocked-times?id=${id}`, { method: "DELETE" });
    await loadAll();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <main className="admin-page">
      <header className="site-header admin-header">
        <a className="brand" href="/">
          <span className="brand-mark">
            <Scissors size={18} />
          </span>
          Aura & Edge
        </a>
        <button className="secondary-button" onClick={logout}>
          <LogOut size={18} />
          Sign out
        </button>
      </header>

      <section className="admin-shell">
        <div className="section-heading row">
          <div>
            <p className="eyebrow">Admin dashboard</p>
            <h1>Appointments, services, and salon availability</h1>
          </div>
          <div className="filter-row">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status filter">
              <option value="ALL">All statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELED">Canceled</option>
              <option value="NO_SHOW">No show</option>
            </select>
            <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Date filter" />
          </div>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}
        {message ? <p className="success-banner">{message}</p> : null}

        <div className="metric-grid">
          <div className="metric"><span>Total</span><strong>{appointmentSummary.total}</strong></div>
          <div className="metric"><span>Confirmed</span><strong>{appointmentSummary.confirmed}</strong></div>
          <div className="metric"><span>Completed</span><strong>{appointmentSummary.completed}</strong></div>
        </div>

        <section className="admin-grid">
          <div className="dashboard-card wide-card">
            <div className="card-title">
              <CalendarDays size={20} />
              <h2>Appointments</h2>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>
                        <strong>{appointment.customerName}</strong>
                        <span>{appointment.phone}</span>
                      </td>
                      <td>{appointment.service.name}</td>
                      <td>{appointment.date}</td>
                      <td>{appointment.startTime} - {appointment.endTime}</td>
                      <td>
                        <select value={appointment.status} onChange={(event) => changeAppointmentStatus(appointment.id, event.target.value)}>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELED">Canceled</option>
                          <option value="NO_SHOW">No show</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5}>No appointments found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <form className="dashboard-card" onSubmit={saveService}>
            <div className="card-title">
              <Edit3 size={20} />
              <h2>{serviceForm.id ? "Edit service" : "Add service"}</h2>
            </div>
            <label className="field-label">
              Name
              <input value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} required />
            </label>
            <label className="field-label">
              Description
              <textarea value={serviceForm.description} onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })} required />
            </label>
            <div className="two-col">
              <label className="field-label">
                Duration
                <input type="number" min="15" step="15" value={serviceForm.durationMinutes} onChange={(event) => setServiceForm({ ...serviceForm, durationMinutes: Number(event.target.value) })} required />
              </label>
              <label className="field-label">
                Area
                <input value={serviceForm.serviceArea} onChange={(event) => setServiceForm({ ...serviceForm, serviceArea: event.target.value })} required />
              </label>
            </div>
            <label className="check-row">
              <input type="checkbox" checked={serviceForm.active} onChange={(event) => setServiceForm({ ...serviceForm, active: event.target.checked })} />
              Active
            </label>
            <button className="primary-button wide" type="submit">
              <Save size={18} />
              Save service
            </button>
            <div className="service-list">
              {services.map((service) => (
                <button type="button" key={service.id} onClick={() => setServiceForm(service)} className="service-row">
                  <span>{service.name}</span>
                  <small>{service.active ? "Active" : "Inactive"}</small>
                </button>
              ))}
            </div>
          </form>

          <form className="dashboard-card" onSubmit={addBlockedTime}>
            <div className="card-title">
              <Ban size={20} />
              <h2>Blocked times</h2>
            </div>
            <label className="field-label">
              Date
              <input type="date" value={blockForm.date} onChange={(event) => setBlockForm({ ...blockForm, date: event.target.value })} required />
            </label>
            <div className="two-col">
              <label className="field-label">
                Start
                <input type="time" value={blockForm.startTime} onChange={(event) => setBlockForm({ ...blockForm, startTime: event.target.value })} />
              </label>
              <label className="field-label">
                End
                <input type="time" value={blockForm.endTime} onChange={(event) => setBlockForm({ ...blockForm, endTime: event.target.value })} />
              </label>
            </div>
            <label className="field-label">
              Reason
              <input value={blockForm.reason} onChange={(event) => setBlockForm({ ...blockForm, reason: event.target.value })} placeholder="Unavailable" />
            </label>
            <button className="secondary-button wide" type="submit">
              <Plus size={18} />
              Add block
            </button>
            <div className="service-list">
              {blockedTimes.map((block) => (
                <button type="button" key={block.id} onClick={() => removeBlockedTime(block.id)} className="service-row">
                  <span>{block.date} {block.startTime ? `${block.startTime}-${block.endTime}` : "Full day"}</span>
                  <small>{block.reason}</small>
                </button>
              ))}
            </div>
          </form>

          <div className="dashboard-card wide-card">
            <div className="card-title">
              <BellRing size={20} />
              <h2>Mock notifications</h2>
            </div>
            <div className="notification-list">
              {notifications.map((notification) => (
                <div className="notification-row" key={notification.id}>
                  <span className="status-pill">{notification.channel}</span>
                  <strong>{notification.purpose}</strong>
                  <span>{notification.recipient}</span>
                  <small>{notification.scheduledFor ? `Scheduled ${new Date(notification.scheduledFor).toLocaleString()}` : `Created ${new Date(notification.createdAt).toLocaleString()}`}</small>
                </div>
              ))}
              {notifications.length === 0 ? <p className="muted">No notification records yet.</p> : null}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
