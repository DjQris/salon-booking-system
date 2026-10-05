"use client";

import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Scissors,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

export function CustomerSignIn({
  configured,
  failed,
}: {
  configured: boolean;
  failed: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    failed ? "We couldn't complete sign-in. Please try again." : "",
  );
  async function login() {
    if (!configured) {
      setError("Online sign-in is not available yet. Please try again later.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/book" });
    } catch {
      setError("Unable to connect. Please try again.");
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
        <p className="document-eyebrow">A MOMENT FOR YOURSELF</p>
        <h1>
          Your next visit
          <br />
          starts here.
        </h1>
        <p className="muted">
          Sign in to choose your service and find your time.
        </p>
        <button
          className="primary-button wide"
          onClick={login}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={18} className="spinning" />
          ) : (
            <ShieldCheck size={18} />
          )}
          {loading ? "Connecting..." : "Continue with Google"}
          <ArrowRight size={17} />
        </button>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <p className="signin-footnote">One account. All your salon visits.</p>
        <div className="signin-team">
          Part of the team?{" "}
          <Link href="/admin/login">
            Admin sign in <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}
