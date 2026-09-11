import { Suspense } from "react";
import { ManageAppointment } from "@/components/ManageAppointment";

export default function ManagePage() {
  return (
    <Suspense fallback={<main className="manage-page" />}>
      <ManageAppointment />
    </Suspense>
  );
}
