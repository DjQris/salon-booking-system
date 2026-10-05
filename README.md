# Aura & Edge

Next.js App Router, TypeScript, Prisma and PostgreSQL salon booking app. Customer authentication uses Google through NextAuth.js; administrators use a separate password-based session. Notifications remain mock records.

## Local setup

1. Install dependencies with `npm install`.
2. Configure the ignored `.env` using the variable names in `.env.example`. `DATABASE_URL` must point to an existing PostgreSQL database (for example `postgresql://USER:PASSWORD@HOST:5432/DATABASE`). The previous SQLite URL is no longer used. Existing SQLite data is not automatically imported or deleted.
3. Set your own `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters. No admin credentials are provided in source code.
4. Generate `NEXTAUTH_SECRET` locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and put the output in your ignored environment file.
5. Create a Google OAuth web application and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Register `http://localhost:3000/api/auth/callback/google` as an authorised redirect URI. Set `NEXTAUTH_URL` to the app origin. Update both URLs when using a different port or deploying.
6. Run `npm run db:push` and `npm run db:seed`, then `npm run dev`.

The landing page and sign-in screens render without a database or OAuth credentials. Google authentication needs configured credentials; booking and admin data need a running PostgreSQL database. An unconfigured Google button displays an availability message and never signs in a fake user.

## Routes and checks

- `/`: public landing page, light by default with a saved dark-mode preference.
- `/signin`: Google customer sign-in; `/book`: authenticated booking experience.
- `/admin/login` and `/admin`: separate admin authentication and dashboard.
- `/manage?token=...`: private appointment manage link.
- `npm run typecheck` and `npm run build`: static checks and production build.
- `npm run test:unit`: admin password verification checks. `npm run test:ui`: Playwright layout, theme, navigation and route protection checks against a running dev server; uses installed Microsoft Edge. Set `TEST_BASE_URL` for another local port.

Prisma uses its JavaScript engine and PostgreSQL driver adapter. `db:seed` preserves edited services and hours; it updates the configured administrator password and invalidates that administrator's sessions. Use `prisma migrate` for a reviewed production migration workflow rather than `db:push`.

Fonts are self-hosted from Fontsource (Inter and Geist). Icons are Lucide. The salon cover photograph is served from Unsplash.

References: [Prisma JavaScript engine](https://docs.prisma.io/docs/orm/v6/prisma-client/setup-and-configuration/no-rust-engine), [NextAuth Google provider](https://next-auth.js.org/providers/google).
