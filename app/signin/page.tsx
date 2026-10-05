import { CustomerSignIn } from "@/components/CustomerSignIn";
import { isGoogleConfigured } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <CustomerSignIn configured={isGoogleConfigured()} failed={Boolean(params.error)} />;
}
