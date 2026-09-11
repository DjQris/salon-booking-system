# Pre-Launch Checklist: Scaling to Real Customer Data

This app is currently safe as a local demo. Nothing sensitive is committed to
the public repo at `github.com/DjQris/salon-booking-system`, and no real data
exists yet.

Everything below becomes relevant the moment you point a real domain at a real
deployment and start taking real bookings, because the app collects customer
names, phone numbers, emails, and appointment notes.

---

## Must fix before launch

### 1. Remove the pre-filled demo credentials

**Where:** `components/LoginForm.tsx` (lines 7-8)

The admin login form ships with `admin@salon.test` / `admin123` pre-filled as
the default field values. This is public on GitHub, and it is the real default
login unless overridden.

- Change both `useState` calls to start as empty strings.
- Set a strong `ADMIN_EMAIL` and `ADMIN_PASSWORD` as environment variables on
  your host (Vercel project settings, Railway variables, etc.).
- Never commit those values. `.gitignore` already excludes `.env`, keep it that
  way.

### 2. Upgrade password hashing

**Where:** `lib/auth-crypto.ts`

`hashPassword` uses a plain, unsalted SHA-256 digest. SHA-256 is designed to be
fast, which makes it cheap to brute-force and vulnerable to rainbow tables.

- Replace with `bcrypt` or `argon2` (both handle salting automatically).
- These are async, so `hashPassword` becomes a promise and the comparison in
  `app/api/admin/login/route.ts` (line 12) must be updated to `await` a
  `compare()` call instead of comparing hash strings directly.
- Existing admin rows seeded with SHA-256 hashes will need to be re-seeded, see
  `lib/db.ts` around line 347.

### 3. Move off `sql.js`

**Where:** `lib/db.ts`, `package.json`

The app stores data with `sql.js`, an in-memory WASM build of SQLite that only
persists if the file is written back manually. On serverless hosts such as
Vercel the filesystem is ephemeral and every instance gets its own copy, so real
bookings would silently disappear on redeploy or diverge between instances.

- Move to a hosted database: Postgres (Neon, Supabase, AWS RDS) or a managed
  SQLite service such as Turso.
- Connect over TLS, with the connection string in an environment variable.
- The schema in `lib/db.ts` (appointments, admin_users, admin_sessions, and the
  services tables) ports over with minor SQL dialect changes.

### 4. Add login rate limiting

**Where:** `app/api/admin/login/route.ts`

The admin login route has no throttling or lockout, so it can be brute-forced.
This matters more while the weak hash from item 2 is still in place.

- Add per-IP rate limiting (Upstash Ratelimit, or middleware-level throttling).
- Consider a temporary lockout after repeated failures for the same email.

---

## Should fix before launch

### 5. Mark the session cookie as secure

**Where:** `app/api/admin/login/route.ts` (lines 19-24)

The session cookie sets `httpOnly` and `sameSite: "lax"` but not `secure`, so it
can be sent over plain HTTP.

- Add `secure: true` (or gate it on `process.env.NODE_ENV === "production"` so
  local development over HTTP still works).

### 6. Enforce HTTPS in production

Most hosts do this by default. Confirm that HTTP requests redirect to HTTPS
before going live, since the session cookie and admin password travel over this
connection.

### 7. Validate and sanitize booking input

**Where:** `app/api/appointments/route.ts`, `lib/validation.ts`

The public booking endpoints write customer name, phone, email, and notes
straight into the database.

- Validate types, lengths, and formats on the server, not just the client.
- Reject or escape anything that gets rendered back into the admin dashboard.

---

## Worth doing as you grow

- **Data retention and deletion.** You will be storing real personal data.
  Decide how long bookings are kept, and be able to delete a customer's records
  on request.
- **Keep PII out of logs.** Avoid logging names, phone numbers, or emails in
  server output.
- **Back up the database on a schedule** once real bookings matter.
- **Two-factor authentication**, or at minimum a second admin account with
  audit logging, if more than one person will manage bookings.

---

## Current state (verified 2026-09-11)

- Repo visibility: **public**
- Committed secrets: **none found**. No `.env`, no database file, no API keys
  or private keys in any tracked file.
- `.gitignore` correctly excludes `.env`, `.env*.local`, `prisma/dev.db`, and
  `data/*.sqlite`.
- `.env.example` contains placeholder values only, which is its intended
  purpose.
