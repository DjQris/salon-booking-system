import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { createAdminSessionRecord, getAdminBySessionToken } from "@/lib/db";
import { hashPassword } from "@/lib/auth-crypto";

export const ADMIN_SESSION_COOKIE = "salon_admin_session";
export { hashPassword };

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);

  await createAdminSessionRecord(adminId, token, expiresAt);

  return { token, expiresAt };
}

export async function getAdminFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return getAdminBySessionToken(token);
}

export async function requireAdmin() {
  const admin = await getAdminFromCookie();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function isAdminRequest() {
  return Boolean(await getAdminFromCookie());
}
