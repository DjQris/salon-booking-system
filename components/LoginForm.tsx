"use client";

import { LockKeyhole, Scissors } from "lucide-react";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("admin@salon.test");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to sign in.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={login}>
        <a className="brand center" href="/">
          <span className="brand-mark">
            <Scissors size={18} />
          </span>
          Aura & Edge
        </a>
        <div>
          <p className="eyebrow">Admin access</p>
          <h1>Sign in to manage bookings</h1>
        </div>
        {error ? <p className="error-banner">{error}</p> : null}
        <label className="field-label">
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="field-label">
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button className="primary-button wide" type="submit" disabled={loading}>
          <LockKeyhole size={18} />
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="muted">Demo credentials come from the seed data and can be changed in environment variables.</p>
      </form>
    </main>
  );
}
