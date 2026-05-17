import React from "react";
import { MessageCircle, Store, Building2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LandingPage({ lang = "ar" }) {
  const isAr = lang === "ar";

  const navigate = useNavigate();
  
  const t = {
    ar: {
      heroTitle: "ابحث عن الأنشطة الموثوقة عبر واتساب",
      heroSubtitle:
        "TrustedLinks يساعدك بالوصول إلى أفضل الأنشطة التجارية القريبة منك مباشرة عبر واتساب.",
      startSearch: "ابدأ البحث عبر واتساب",
      merchantTitle: "للتجار والشركات",
      merchantText:
        "اجعل نشاطك يظهر للعملاء عند البحث عن الخدمات والمنتجات القريبة.",
      merchantBtn: "سجّل نشاطك",
      mallTitle: "للمولات والرعاة",
      mallText:
        "حلول ذكية للمولات والحملات الدعائية لزيادة تفاعل العملاء مع المتاجر.",
      mallBtn: "حلول المولات",
      howTitle: "كيف تعمل المنصة",
      step1: "العميل يرسل طلبه عبر واتساب",
      step2: "TrustedLinks يرشح أفضل النتائج",
      step3: "تواصل مباشر مع النشاط التجاري",
      trustTitle: "الثقة والأمان",
      trustText:
        "نظام آمن يركز على الخصوصية، منع الإزعاج، وتحليل الأداء بشكل ذكي.",
    },

    en: {
      heroTitle: "Find Trusted Businesses Through WhatsApp",
      heroSubtitle:
        "TrustedLinks helps users discover nearby businesses directly through WhatsApp.",
      startSearch: "Start Searching",
      merchantTitle: "For Businesses",
      merchantText:
        "Appear when customers search for nearby products and services.",
      merchantBtn: "Register Business",
      mallTitle: "For Malls & Sponsors",
      mallText:
        "Smart mall campaigns and sponsorship solutions for tenant engagement.",
      mallBtn: "Mall Solutions",
      howTitle: "How It Works",
      step1: "Customer sends a request through WhatsApp",
      step2: "TrustedLinks recommends top matches",
      step3: "Direct communication with the business",
      trustTitle: "Privacy & Trust",
      trustText:
        "Privacy-first system with anti-spam protection and smart insights.",
    },
  }[lang];

  return (
    <div
      className={`min-h-screen bg-white text-slate-900 ${
        isAr ? "rtl" : "ltr"
      }`}
    >
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-green-50 to-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-20 text-center">
          <div className="mb-5 rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
            TrustedLinks
          </div>

          <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            {t.heroTitle}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {t.heroSubtitle}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
            href="https://wa.me/97472097723"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-2xl bg-green-600 px-7 py-4 text-white shadow-lg transition hover:bg-green-700"
            >
              <MessageCircle size={20} />
              {t.startSearch}
            </a>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <img
                src="/qr-whatsapp.png"
                alt="WhatsApp QR"
                className="h-28 w-28 object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold">{t.howTitle}</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[t.step1, t.step2, t.step3].map((step, index) => (
            <div
              key={index}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-xl font-bold text-green-700">
                {index + 1}
              </div>

              <p className="text-base leading-7 text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BUSINESS + MALL */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
          {/* Businesses */}
          <div className="rounded-3xl bg-white p-10 shadow-sm">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <Store size={28} />
            </div>

            <h3 className="text-2xl font-bold">{t.merchantTitle}</h3>

            <p className="mt-4 leading-8 text-slate-600">
              {t.merchantText}
            </p>

           <button
  onClick={() => navigate("/register")}
  className="mt-8 rounded-2xl bg-green-600 px-6 py-3 text-white transition hover:bg-green-700"
>
  {t.merchantBtn}
</button>
          </div>

          {/* Malls */}
          <div className="rounded-3xl bg-white p-10 shadow-sm">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <Building2 size={28} />
            </div>

            <h3 className="text-2xl font-bold">{t.mallTitle}</h3>

            <p className="mt-4 leading-8 text-slate-600">
              {t.mallText}
            </p>

           <button
  onClick={() => navigate("/campaign/login")}
  className="mt-8 rounded-2xl border border-green-600 px-6 py-3 text-green-700 transition hover:bg-green-50"
>
  {t.mallBtn}
</button>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="rounded-3xl border border-green-100 bg-green-50 p-10 text-center">
          <div className="mb-5 flex justify-center text-green-700">
            <ShieldCheck size={42} />
          </div>

          <h3 className="text-3xl font-bold">{t.trustTitle}</h3>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            {t.trustText}
          </p>
        </div>
      </section>
    </div>
  );
}
