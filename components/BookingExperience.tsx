"use client";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock,
  Mail,
  MessageSquareText,
  Phone,
  Scissors,
  ShieldCheck,
  Sparkles,
  User
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  serviceArea: string;
};

type Slot = {
  startTime: string;
  endTime: string;
};

type AppointmentResponse = {
  appointment: {
    id: string;
    customerName: string;
    phone: string;
    email?: string | null;
    date: string;
    startTime: string;
    endTime: string;
    service: Service;
  };
  manageUrl: string;
};

const today = new Date();
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export function BookingExperience() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [date, setDate] = useState(tomorrow);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [step, setStep] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<AppointmentResponse | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    notes: ""
  });

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId),
    [selectedServiceId, services]
  );

  useEffect(() => {
    fetch("/api/services")
      .then((response) => response.json())
      .then((data) => {
        setServices(data.services ?? []);
        setSelectedServiceId(data.services?.[0]?.id ?? "");
      })
      .catch(() => setError("Services could not be loaded."));
  }, []);

  useEffect(() => {
    if (!selectedServiceId || !date) {
      return;
    }

    setLoadingSlots(true);
    setSelectedSlot(null);
    fetch(`/api/slots?serviceId=${selectedServiceId}&date=${date}`)
      .then((response) => response.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setError("Available times could not be loaded."))
      .finally(() => setLoadingSlots(false));
  }, [selectedServiceId, date]);

  function resetBooking() {
    setStep(0);
    setSelectedSlot(null);
    setConfirmation(null);
    setError("");
    setForm({ customerName: "", phone: "", email: "", notes: "" });
  }

  async function submitBooking(event: FormEvent) {
    event.preventDefault();
    if (!selectedService || !selectedSlot) {
      setError("Choose a service and available time.");
      return;
    }

    setSubmitting(true);
    setError("");

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        serviceId: selectedService.id,
        date,
        startTime: selectedSlot.startTime
      })
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Booking could not be created.");
      setSubmitting(false);
      return;
    }

    setConfirmation(data);
    setStep(4);
    setSubmitting(false);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/">
          <span className="brand-mark">
            <Scissors size={18} />
          </span>
          Aura & Edge
        </a>
        <nav>
          <a href="/manage">Manage booking</a>
          <a href="/admin/login">Admin</a>
        </nav>
      </header>

      <section className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">Unisex salon booking</p>
          <h1>Aura & Edge Salon</h1>
          <p>
            Book washing, barbing, shaving, plaiting, conditioning, and care appointments
            from live available time slots.
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => {
                resetBooking();
                setModalOpen(true);
              }}
            >
              <CalendarDays size={18} />
              Book appointment
            </button>
            <a className="secondary-button" href="/manage">
              <Clock size={18} />
              Manage booking
            </a>
          </div>
        </div>
        <div className="hero-media" aria-label="Salon styling station">
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
            alt="Salon chair and styling mirrors"
          />
        </div>
      </section>

      <section className="trust-strip">
        <div>
          <ShieldCheck size={20} />
          <span>Auto-confirmed bookings</span>
        </div>
        <div>
          <MessageSquareText size={20} />
          <span>Mock SMS and email summaries</span>
        </div>
        <div>
          <Sparkles size={20} />
          <span>Separate capacity by service area</span>
        </div>
      </section>

      <section className="service-band">
        <div className="section-heading">
          <p className="eyebrow">Services</p>
          <h2>Choose a service and see only times that can actually be booked.</h2>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service.id}>
              <div className="icon-chip">
                <Scissors size={18} />
              </div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <span>{service.durationMinutes} min</span>
            </article>
          ))}
        </div>
      </section>

      {modalOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Book appointment">
          <div className="booking-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Step {Math.min(step + 1, 5)} of 5</p>
                <h2>{confirmation ? "Booking confirmed" : "Book your appointment"}</h2>
              </div>
              <button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Close booking modal">
                x
              </button>
            </div>

            <div className="step-dots" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((index) => (
                <span className={index <= step ? "active" : ""} key={index} />
              ))}
            </div>

            {error ? <p className="error-banner">{error}</p> : null}

            {step === 0 ? (
              <div className="modal-panel">
                <h3>Select service</h3>
                <div className="choice-grid">
                  {services.map((service) => (
                    <button
                      className={selectedServiceId === service.id ? "choice-card selected" : "choice-card"}
                      key={service.id}
                      onClick={() => setSelectedServiceId(service.id)}
                    >
                      <strong>{service.name}</strong>
                      <span>{service.durationMinutes} min · {service.serviceArea}</span>
                    </button>
                  ))}
                </div>
                <div className="modal-actions">
                  <button className="primary-button" disabled={!selectedServiceId} onClick={() => setStep(1)}>
                    Continue
                  </button>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="modal-panel">
                <h3>Pick date and time</h3>
                <label className="field-label">
                  Date
                  <input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} />
                </label>
                <div className="slot-grid">
                  {loadingSlots ? <p>Loading times...</p> : null}
                  {!loadingSlots && slots.length === 0 ? <p>No open times for this date.</p> : null}
                  {slots.map((slot) => (
                    <button
                      className={selectedSlot?.startTime === slot.startTime ? "slot-button selected" : "slot-button"}
                      key={slot.startTime}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
                <div className="modal-actions split">
                  <button className="secondary-button" onClick={() => setStep(0)}>
                    <ChevronLeft size={18} />
                    Back
                  </button>
                  <button className="primary-button" disabled={!selectedSlot} onClick={() => setStep(2)}>
                    Continue
                  </button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <form className="modal-panel" onSubmit={(event) => {
                event.preventDefault();
                setStep(3);
              }}>
                <h3>Your details</h3>
                <label className="field-label">
                  <User size={16} />
                  Name
                  <input value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} required />
                </label>
                <label className="field-label">
                  <Phone size={16} />
                  Phone
                  <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
                </label>
                <label className="field-label">
                  <Mail size={16} />
                  Email
                  <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Optional" />
                </label>
                <label className="field-label">
                  Notes
                  <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Optional" />
                </label>
                <div className="modal-actions split">
                  <button className="secondary-button" type="button" onClick={() => setStep(1)}>
                    <ChevronLeft size={18} />
                    Back
                  </button>
                  <button className="primary-button" type="submit">
                    Review
                  </button>
                </div>
              </form>
            ) : null}

            {step === 3 && selectedService && selectedSlot ? (
              <form className="modal-panel" onSubmit={submitBooking}>
                <h3>Review appointment</h3>
                <div className="summary-box">
                  <p><strong>Service</strong><span>{selectedService.name}</span></p>
                  <p><strong>Date</strong><span>{date}</span></p>
                  <p><strong>Time</strong><span>{selectedSlot.startTime} - {selectedSlot.endTime}</span></p>
                  <p><strong>Name</strong><span>{form.customerName}</span></p>
                  <p><strong>Phone</strong><span>{form.phone}</span></p>
                  <p><strong>Email</strong><span>{form.email || "Not provided"}</span></p>
                </div>
                <div className="modal-actions split">
                  <button className="secondary-button" type="button" onClick={() => setStep(2)}>
                    <ChevronLeft size={18} />
                    Back
                  </button>
                  <button className="primary-button" type="submit" disabled={submitting}>
                    <Check size={18} />
                    {submitting ? "Confirming..." : "Confirm booking"}
                  </button>
                </div>
              </form>
            ) : null}

            {step === 4 && confirmation ? (
              <div className="modal-panel success-panel">
                <div className="success-icon"><Check size={30} /></div>
                <h3>Your appointment is confirmed</h3>
                <p>
                  {confirmation.appointment.service.name} on {confirmation.appointment.date} from{" "}
                  {confirmation.appointment.startTime} to {confirmation.appointment.endTime}.
                </p>
                <div className="summary-box">
                  <p><strong>Mock notifications</strong><span>Email/SMS summary plus 24h and 2h reminders</span></p>
                  <p><strong>Manage link</strong><a href={confirmation.manageUrl}>Open booking controls</a></p>
                </div>
                <div className="modal-actions">
                  <button className="primary-button" onClick={() => setModalOpen(false)}>
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
