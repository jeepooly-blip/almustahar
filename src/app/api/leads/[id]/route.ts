import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const Schema = z.object({
      status: z.enum(["ACCEPTED", "REJECTED", "CONVERTED"]),
      counterOffer: z.number().optional(),
    });
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "not_available", message: "Database not configured" }, { status: 503 });
    }

    // Verify the lead belongs to this lawyer
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Only the assigned lawyer or an admin can update
    if (session.role !== "ADMIN") {
      const lawyerProfile = await prisma.lawyerProfile.findUnique({
        where: { userId: session.id },
      });
      if (!lawyerProfile || lawyerProfile.id !== lead.lawyerId) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        status: parsed.data.status,
        ...(parsed.data.status === "ACCEPTED" ? { respondedAt: new Date() } : {}),
        ...(parsed.data.status === "CONVERTED" ? { convertedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (e) {
    console.error("Lead update error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}