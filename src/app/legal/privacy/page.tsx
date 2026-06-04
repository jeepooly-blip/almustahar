export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">سياسة الخصوصية</h1>
      <p className="mt-2 text-sm text-ink-500">آخر تحديث: يونيو 2026</p>
      <div className="mt-6 space-y-4 text-sm leading-8 text-ink-700">
        <p>
          في <strong>ليجال نافيغيتور برو</strong>، نلتزم بحماية خصوصيتك. توضح هذه
          السياسة كيف نجمع بياناتك ونستخدمها ونحميها.
        </p>
        <h2 className="text-xl font-bold text-ink-900">1. البيانات التي نجمعها</h2>
        <ul className="list-disc ps-6">
          <li><strong>معلومات الحساب</strong>: رقم الهاتف، الاسم، البريد الإلكتروني (اختياري)</li>
          <li><strong>الوثائق</strong>: الملفات التي ترفعها لتحليلها</li>
          <li><strong>بيانات الاستخدام</strong>: كيفية استخدامك للمنصة (لتحسين الخدمة)</li>
        </ul>
        <h2 className="text-xl font-bold text-ink-900">2. كيف نستخدم بياناتك</h2>
        <ul className="list-disc ps-6">
          <li>لتقديم خدمة تحليل الوثائق</li>
          <li>لتحسين دقة نماذج الذكاء الاصطناعي</li>
          <li>للتواصل معك بخصوص حسابك وخدمتك</li>
          <li>للامتثال لالتزاماتنا القانونية</li>
        </ul>
        <h2 className="text-xl font-bold text-ink-900">3. التشفير والحماية</h2>
        <p>
          نستخدم تشفير AES-256 للبيانات المخزّنة و TLS 1.3 للبيانات المنقولة. لا
          نشارك وثائقك مع أي طرف ثالث دون موافقتك الصريحة.
        </p>
        <h2 className="text-xl font-bold text-ink-900">4. الاحتفاظ بالبيانات</h2>
        <p>
          الوثائق المرفوعة من مستخدمين مجانيين تُحذف تلقائياً بعد 90 يوماً. يمكنك
          طلب حذف حسابك وبياناتك في أي وقت.
        </p>
        <h2 className="text-xl font-bold text-ink-900">5. ملفات تعريف الارتباط</h2>
        <p>
          نستخدم ملفات تعريف الارتباط الضرورية لتشغيل المنصة، وملفات تحليلية (مثل
          PostHog) لفهم استخدام المنصة وتحسينها.
        </p>
        <h2 className="text-xl font-bold text-ink-900">6. حقوقك</h2>
        <ul className="list-disc ps-6">
          <li>الحق في الوصول إلى بياناتك</li>
          <li>الحق في تصحيح بياناتك</li>
          <li>الحق في حذف بياناتك (الحق في النسيان)</li>
          <li>الحق في نقل بياناتك</li>
        </ul>
        <h2 className="text-xl font-bold text-ink-900">7. التواصل معنا</h2>
        <p>
          لأي استفسار حول الخصوصية، تواصل معنا على{" "}
          <a href="mailto:privacy@legalnavigator.jo" className="text-brand-700 hover:underline">
            privacy@legalnavigator.jo
          </a>
        </p>
      </div>
    </div>
  );
}

