import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Schema = z.object({
  phone: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
    }
    const { phone } = parsed.data;

    // Generate a 4-digit code. In production, this would be sent via Twilio/Vonage.
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    if (process.env.DATABASE_URL) {
      await prisma.otpChallenge.create({
        data: { phone, code, expiresAt },
      });
    }

    // In production, send SMS via Twilio/Vonage here:
    // if (process.env.TWILIO_ACCOUNT_SID) { ... }

    // Dev code is ONLY logged to server-side console — never sent to the client.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV OTP] Phone: ${phone}, Code: ${code}`);
    }

    return NextResponse.json({
      ok: true,
      phone,
    });
  } catch (e) {
    console.error("OTP request error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}