import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { customerAuthOptions } from "@/lib/customer-auth";
import { BookingExperience } from "@/components/BookingExperience";

export default async function BookingPage() {
  const session = await getServerSession(customerAuthOptions);
  if (!session?.user?.email) redirect("/signin");
  return <BookingExperience customer={{ name: session.user.name ?? "", email: session.user.email }} />;
}
