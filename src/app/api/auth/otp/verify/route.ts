import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Schema = z.object({
  phone: z.string().min(8),
  code: z.string().length(4),
  name: z.string().optional(),
  role: z.enum(["CITIZEN", "LAWYER"]).default("CITIZEN"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    const { phone, code, name, role } = parsed.data;

    if (process.env.DATABASE_URL) {
      const challenge = await prisma.otpChallenge.findFirst({
        where: { phone, code, consumed: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });
      if (!challenge) {
        return NextResponse.json({ error: "invalid_code" }, { status: 401 });
      }
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumed: true },
      });
    } else {
      // Dev mode: accept the demo code 1234
      if (code !== "1234") {
        return NextResponse.json({ error: "invalid_code" }, { status: 401 });
      }
    }

    // Find or create the user
    let user;
    if (process.env.DATABASE_URL) {
      user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            phone,
            name: name ?? "مستخدم جديد",
            role,
            isVerified: true,
          },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });
      }
    } else {
      // Dev mode: use mock user
      user = {
        id: role === "LAWYER" ? "u3" : "u1",
        name: name ?? (role === "LAWYER" ? "أحمد الرواشدة" : "سامي العلي"),
        phone,
        role,
      };
    }

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    console.error("OTP verify error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
