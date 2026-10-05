import { ManageAppointment } from "@/components/ManageAppointment";
import { Suspense } from "react";

export default function ManagePage() {
  return <Suspense fallback={<main className="narrow-shell">Loading appointment...</main>}><ManageAppointment /></Suspense>;
}
