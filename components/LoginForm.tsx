"use client";

import { ArrowLeft, ArrowRight, LockKeyhole, Scissors } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to sign in.");
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="signin-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} /> Back to the salon
      </Link>
      <div className="signin-content">
        <Link className="wordmark" href="/">
          <Scissors size={27} strokeWidth={1.5} /> Aura & Edge
        </Link>
        <p className="document-eyebrow">FOR THE SALON TEAM</p>
        <h1>Welcome back.</h1>
        <p className="muted">Sign in to take care of the day ahead.</p>
        <form onSubmit={login}>
          <label className="field-label">
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="field-label">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button wide" disabled={loading}>
            <LockKeyhole size={17} />
            {loading ? "Signing in..." : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="signin-footnote">Your salon, thoughtfully organised.</p>
        <div className="signin-team">
          Here for an appointment?{" "}
          <Link href="/signin">
            Customer sign in <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}
