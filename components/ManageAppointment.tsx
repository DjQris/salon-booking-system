"use client";

import { CalendarClock, Check, Scissors, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Appointment = {
  id: string;
  customerName: string;
  phone: string;
  email?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceId: string;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    serviceArea: string;
  };
};

type Slot = {
  startTime: string;
  endTime: string;
};

export function ManageAppointment() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    fetch(`/api/appointments/manage?token=${token}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setAppointment(data.appointment);
        setDate(data.appointment.date);
      })
      .catch(() => setError("Booking could not be loaded."));
  }, [token]);

  useEffect(() => {
    if (!appointment?.serviceId || !date || appointment.status !== "CONFIRMED") {
      return;
    }

    fetch(`/api/slots?serviceId=${appointment.serviceId}&date=${date}`)
      .then((response) => response.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setError("Available times could not be loaded."));
  }, [appointment?.serviceId, appointment?.status, date]);

  async function updateAppointment(action: "cancel" | "reschedule", event?: FormEvent) {
    event?.preventDefault();
    setError("");
    setMessage("");

    const response = await fetch("/api/appointments/manage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action, date, startTime })
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to update appointment.");
      return;
    }

    setAppointment(data.appointment);
    setMessage(action === "cancel" ? "Appointment canceled." : "Appointment rescheduled.");
  }

  return (
    <main className="manage-page">
      <header className="site-header">
        <a className="brand" href="/">
          <span className="brand-mark">
            <Scissors size={18} />
          </span>
          Aura & Edge
        </a>
        <nav>
          <a href="/">Book</a>
          <a href="/admin/login">Admin</a>
        </nav>
      </header>

      <section className="narrow-shell">
        <div className="section-heading">
          <p className="eyebrow">Manage booking</p>
          <h1>Cancel or reschedule your appointment</h1>
        </div>

        {!token ? <p className="error-banner">Open this page from your booking confirmation link.</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}
        {message ? <p className="success-banner">{message}</p> : null}

        {appointment ? (
          <div className="dashboard-card">
            <div className="appointment-title">
              <CalendarClock size={22} />
              <div>
                <h2>{appointment.service.name}</h2>
                <p>{appointment.date} · {appointment.startTime} - {appointment.endTime}</p>
              </div>
              <span className={`status-pill ${appointment.status.toLowerCase()}`}>{appointment.status}</span>
            </div>

            <div className="summary-box">
              <p><strong>Name</strong><span>{appointment.customerName}</span></p>
              <p><strong>Phone</strong><span>{appointment.phone}</span></p>
              <p><strong>Email</strong><span>{appointment.email || "Not provided"}</span></p>
            </div>

            {appointment.status === "CONFIRMED" ? (
              <div className="manage-actions">
                <button className="danger-button" onClick={() => updateAppointment("cancel")}>
                  <X size={18} />
                  Cancel appointment
                </button>
                <form className="reschedule-form" onSubmit={(event) => updateAppointment("reschedule", event)}>
                  <label className="field-label">
                    New date
                    <input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} />
                  </label>
                  <label className="field-label">
                    New time
                    <select value={startTime} onChange={(event) => setStartTime(event.target.value)} required>
                      <option value="">Choose time</option>
                      {slots.map((slot) => (
                        <option value={slot.startTime} key={slot.startTime}>
                          {slot.startTime} - {slot.endTime}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="primary-button" type="submit">
                    <Check size={18} />
                    Reschedule
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
