import { NextResponse } from "next/server";
import { getActiveServices } from "@/lib/db";

export async function GET() {
  const services = await getActiveServices();

  return NextResponse.json({ services });
}
