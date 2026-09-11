import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getAllServices, saveService } from "@/lib/db";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const services = await getAllServices();

  return NextResponse.json({ services });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const serviceArea = String(body.serviceArea ?? "").trim().toLowerCase();
  const durationMinutes = Number(body.durationMinutes);

  if (!name || !description || !serviceArea || !Number.isFinite(durationMinutes) || durationMinutes < 15) {
    return NextResponse.json({ error: "Complete the service details." }, { status: 400 });
  }

  const service = await saveService({
    name,
    description,
    serviceArea,
    durationMinutes,
    active: Boolean(body.active ?? true)
  });

  return NextResponse.json({ service });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id ?? "");
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const serviceArea = String(body.serviceArea ?? "").trim().toLowerCase();
  const durationMinutes = Number(body.durationMinutes);

  if (!id || !name || !description || !serviceArea || !Number.isFinite(durationMinutes) || durationMinutes < 15) {
    return NextResponse.json({ error: "Complete the service details." }, { status: 400 });
  }

  const service = await saveService({
    id,
    name,
    description,
    serviceArea,
    durationMinutes,
    active: Boolean(body.active)
  });

  return NextResponse.json({ service });
}
