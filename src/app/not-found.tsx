import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page max-w-2xl py-24 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-ink-100 text-ink-500">
        <Search className="h-10 w-10" />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold text-ink-900">الصفحة غير موجودة</h1>
      <p className="mt-2 text-sm text-ink-600">
        قد تكون الصفحة قد نُقلت أو حُذفت. تحقق من الرابط أو عُد إلى الصفحة الرئيسية.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button icon={<Home className="h-4 w-4" />}>الصفحة الرئيسية</Button>
        </Link>
      </div>
    </div>
  );
}
