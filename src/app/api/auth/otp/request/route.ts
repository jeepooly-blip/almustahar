import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";

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

    // In dev, surface the code in the response for easy testing
    return NextResponse.json({
      ok: true,
      phone,
      // Remove this in production — code should only come via SMS
      devCode: process.env.NODE_ENV === "production" ? undefined : code,
    });
  } catch (e) {
    console.error("OTP request error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
