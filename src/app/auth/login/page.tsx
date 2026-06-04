"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/session-provider";
import { useLocale } from "@/lib/locale-provider";
import { showToast } from "@/components/ui/toast";
import { Scale, ArrowLeft, Phone, KeyRound, Sparkles, Check, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { t, locale, setLocale } = useLocale();
  const router = useRouter();
  const { setUser } = useSession();
  const [step, setStep] = useState<"phone" | "otp" | "role">("phone");
  const [role, setRole] = useState<"CITIZEN" | "LAWYER">("CITIZEN");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "otp") {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  const sendOtp = async () => {
    if (!phone || phone.length < 8) {
      showToast({
        variant: "warning",
        title: locale === "ar" ? "أدخل رقم هاتف صحيح" : "Enter a valid phone",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      setLoading(false);
      setStep("otp");
      showToast({
        variant: "info",
        title: locale === "ar" ? "تم إرسال الرمز" : "Code sent",
        description: data.devCode
          ? `${locale === "ar" ? "الرمز التجريبي" : "Demo code"}: ${data.devCode}`
          : locale === "ar"
            ? "تحقق من رسائلك النصية"
            : "Check your SMS",
      });
    } catch {
      setLoading(false);
      showToast({ variant: "danger", title: locale === "ar" ? "فشل الإرسال" : "Failed to send" });
    }
  };

  const verify = async () => {
    const code = otp.join("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, role }),
      });
      if (!res.ok) {
        setLoading(false);
        showToast({ variant: "danger", title: locale === "ar" ? "رمز خاطئ" : "Wrong code" });
        return;
      }
      const data = await res.json();
      setUser({
        id: data.user.id,
        name: data.user.name,
        role: data.user.role ?? role,
        phone,
        lawyerId: data.user.role === "LAWYER" ? "l1" : undefined,
      });
      showToast({ variant: "success", title: locale === "ar" ? "مرحباً بك" : "Welcome" });
      router.push(role === "LAWYER" ? "/lawyer/dashboard" : "/dashboard");
    } catch {
      setLoading(false);
      showToast({ variant: "danger", title: locale === "ar" ? "فشل التحقق" : "Verification failed" });
    }
  };

  const handleOtpChange = (idx: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[idx] = v;
    setOtp(next);
    if (v && idx < 3) otpRefs.current[idx + 1]?.focus();
  };

  return (
    <div className="container-page max-w-md py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg">
          <Scale className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-ink-900">
          {t.auth.loginTitle}
        </h1>
        <p className="mt-1 text-sm text-ink-600">{t.auth.loginSubtitle}</p>
      </div>

      <Card>
        <CardBody>
          {step === "phone" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-ink-50 p-1">
                <button
                  type="button"
                  onClick={() => setRole("CITIZEN")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    role === "CITIZEN"
                      ? "bg-white text-ink-900 shadow-sm"
                      : "text-ink-600 hover:text-ink-900"
                  }`}
                >
                  {t.auth.asUser}
                </button>
                <button
                  type="button"
                  onClick={() => setRole("LAWYER")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    role === "LAWYER"
                      ? "bg-white text-ink-900 shadow-sm"
                      : "text-ink-600 hover:text-ink-900"
                  }`}
                >
                  {t.auth.asLawyer}
                </button>
              </div>

              <Field label={t.auth.phone} required>
                <div className="relative">
                  <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.auth.phonePlaceholder}
                    className="ps-9"
                    autoComplete="tel"
                  />
                </div>
              </Field>

              <Alert variant="info">
                <div className="text-xs">
                  {locale === "ar"
                    ? "بالمتابعة، أنت توافق على شروط الاستخدام وسياسة الخصوصية."
                    : "By continuing, you agree to our Terms and Privacy Policy."}
                </div>
              </Alert>

              <Button
                onClick={sendOtp}
                loading={loading}
                className="w-full"
                size="lg"
                iconEnd={<ArrowLeft className="h-4 w-4" />}
              >
                {t.auth.sendOtp}
              </Button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-5">
              <div className="text-center">
                <Badge tone="info" icon={<KeyRound className="h-3 w-3" />}>
                  {phone}
                </Badge>
                <h2 className="mt-3 text-lg font-bold text-ink-900">
                  {t.auth.otpTitle}
                </h2>
                <p className="mt-1 text-sm text-ink-500">{t.auth.otpSubtitle}</p>
              </div>
              <div className="flex justify-center gap-2.5" dir="ltr">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digit && i > 0) {
                        otpRefs.current[i - 1]?.focus();
                      }
                    }}
                    className="h-14 w-12 rounded-xl border border-ink-300 bg-white text-center text-2xl font-bold text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                ))}
              </div>
              <Button
                onClick={verify}
                loading={loading}
                className="w-full"
                size="lg"
                icon={<Check className="h-4 w-4" />}
              >
                {t.auth.verify}
              </Button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="font-semibold text-ink-600 hover:text-ink-900"
                >
                  {locale === "ar" ? "تغيير الرقم" : "Change number"}
                </button>
                <button
                  type="button"
                  onClick={sendOtp}
                  className="font-semibold text-brand-700 hover:underline"
                >
                  {t.auth.resend}
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        {locale === "ar"
          ? "تحقق آمن عبر OTP — لا نخزّن كلمة مرور"
          : "Secure OTP verification — we never store a password"}
      </div>

      <div className="mt-4 text-center text-xs text-ink-500">
        {locale === "ar" ? "لغة الواجهة:" : "Interface language:"}{" "}
        <button
          type="button"
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="font-semibold text-brand-700 hover:underline"
        >
          {locale === "ar" ? "English" : "العربية"}
        </button>
      </div>
    </div>
  );
}
