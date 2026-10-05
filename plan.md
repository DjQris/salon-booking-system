# Unisex Salon Booking System

## Summary
Build a polished local demo web app for online salon appointment booking. Customers book from one main experience using modals/step dialogs, while admin has a separate protected dashboard. The demo will use `Next.js`, local `SQLite`, and mock notification records for email/SMS confirmations and reminders.

## Key Changes
- Scaffold a `Next.js` app with a clean responsive salon UI, using modals for customer booking steps instead of separate customer pages.
- Add a local SQLite data layer, preferably through Prisma, with tables for:
  - services
  - appointments
  - salon availability rules
  - blocked dates/times
  - mock notifications
  - admin user/session
- Seed editable salon services such as washing, barbing, shaving, barbing + shaving, children’s cut, plaiting, conditioning, and similar defaults, each with duration and service area.
- Calculate available appointment slots from fixed weekly salon hours, service duration, service area capacity, blocked times, and existing confirmed appointments.
- Support service-area capacity: allow overlapping appointments only when they belong to different service areas.
- Auto-confirm bookings when a valid slot is available.
- Collect customer name, phone, optional email, selected service, date, time, and optional notes.
- Create mock notification records after confirmation:
  - booking confirmation by email/SMS
  - 24-hour reminder
  - 2-hour reminder
- Include secure customer manage links for canceling or rescheduling appointments.
- Add a simple admin login with one configured admin email/password for the demo.
- Admin dashboard should support:
  - viewing/filtering appointments
  - changing appointment status
  - editing service catalog entries
  - deactivating services
  - blocking unavailable dates/times
  - viewing mock notification history

## Interfaces
- Customer booking flow:
  - open booking modal
  - choose service
  - choose available date/time
  - enter contact details
  - review summary
  - confirm appointment
  - show confirmation modal
- Customer manage flow:
  - unique appointment link
  - cancel appointment
  - reschedule by selecting a new valid slot
- Admin routes:
  - `/admin/login`
  - `/admin`
- Internal API/server actions should cover:
  - list active services
  - get available slots for service/date
  - create appointment
  - cancel appointment
  - reschedule appointment
  - admin list/update appointments
  - admin manage services
  - admin manage blocked times
  - list mock notifications

## Test Plan
- Verify customers can book an available slot and receive a confirmation summary.
- Verify already-booked slots are removed only for the matching service area.
- Verify overlapping appointments are allowed across different service areas.
- Verify booking validation blocks missing name, invalid phone, invalid email, inactive service, and unavailable time.
- Verify mock confirmation, 24-hour reminder, and 2-hour reminder records are created.
- Verify customer cancel and reschedule links work without exposing admin access.
- Verify admin login protects the dashboard.
- Verify admin can filter appointments, update status, edit services, and block unavailable times.
- Run build/type checks and basic UI smoke tests across desktop and mobile widths.

## Assumptions
- This is a local demo first, not production deployment.
- Notifications are mocked only; no real email/SMS providers are called in v1.
- Local SQLite is used now, with schema naming kept easy to migrate later to Supabase Postgres.
- Payments, deposits, staff payroll, and real calendar integrations are out of scope for v1.
- Default reminder timing is both 24 hours and 2 hours before the appointment.
