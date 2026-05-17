import React from "react";
import { MessageCircle, Store, Building2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";

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
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

    {/* Logo */}
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-600 text-lg font-bold text-white">
        T
      </div>

      <div>
        <div className="text-lg font-bold text-slate-900">
          TrustedLinks
        </div>

        <div className="text-xs text-slate-500">
          WhatsApp Discovery Platform
        </div>
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-3">

      {/* Language */}
      <button
        onClick={() => {
          const nextLang = lang === "ar" ? "en" : "ar";
          localStorage.setItem("lang", nextLang);
          window.location.reload();
        }}
        className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
      >
        <Globe size={16} />
        {lang === "ar" ? "English" : "العربية"}
      </button>

      {/* Login */}
      <button
        onClick={() => navigate("/login")}
        className="rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700"
      >
        {lang === "ar" ? "تسجيل الدخول" : "Login"}
      </button>
    </div>
  </div>
</header>
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

      {/* SEARCH DEMO */}
<section className="mx-auto max-w-6xl px-6 py-20">
  <div className="rounded-[32px] border border-green-100 bg-gradient-to-br from-green-50 to-white p-10 shadow-sm">

    <div className="mx-auto max-w-3xl text-center">
      <div className="mb-4 inline-flex rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
        WhatsApp AI Search
      </div>

      <h2 className="text-3xl font-bold md:text-5xl">
        {lang === "ar"
          ? "جرّب البحث الآن"
          : "Try Searching Now"}
      </h2>

      <p className="mt-5 text-lg leading-8 text-slate-600">
        {lang === "ar"
          ? "ابحث عن مطاعم، قهوة، صيدليات، أو أي نشاط قريب منك مباشرة عبر واتساب."
          : "Search for restaurants, cafes, pharmacies, and nearby businesses directly through WhatsApp."}
      </p>
    </div>

    {/* Demo Search */}
    <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">

        <MessageCircle className="text-green-600" size={22} />

        <div className="flex-1 text-left text-slate-700">
          {lang === "ar"
            ? "أقرب bubble tea"
            : "Best bubble tea nearby"}
        </div>

        <button className="rounded-xl bg-green-600 px-5 py-2 text-sm text-white transition hover:bg-green-700">
          {lang === "ar" ? "بحث" : "Search"}
        </button>
      </div>

      {/* Demo Results */}
      <div className="mt-6 space-y-4">

        <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
          <div className="flex items-center justify-between">

            <div>
              <div className="font-bold text-slate-900">
                Coco Bubble Tea
              </div>

              <div className="mt-1 text-sm text-slate-600">
                Bubble Tea • 1.2 KM
              </div>
            </div>

            <div className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
              TOP MATCH
            </div>
          </div>

          <div className="mt-4 flex gap-3">

            <button className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm text-white">
              <MessageCircle size={16} />
              WhatsApp
            </button>

            <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700">
              {lang === "ar" ? "الاتجاهات" : "Directions"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 opacity-80">
          <div className="font-semibold text-slate-800">
            Bubble Zone
          </div>

          <div className="mt-1 text-sm text-slate-500">
            Bubble Tea • 2.5 KM
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* FOOTER */}
<footer className="border-t border-slate-100 bg-white">
  <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">

    {/* Left */}
    <div>
      <div className="text-xl font-bold text-slate-900">
        TrustedLinks
      </div>

      <div className="mt-2 text-sm text-slate-500">
        {lang === "ar"
          ? "منصة اكتشاف الأنشطة عبر واتساب"
          : "WhatsApp Business Discovery Platform"}
      </div>
    </div>

    {/* Center */}
    <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">

      <button
        onClick={() => navigate("/register")}
        className="transition hover:text-green-700"
      >
        {lang === "ar" ? "تسجيل النشاط" : "Register"}
      </button>

      <button
        onClick={() => navigate("/login")}
        className="transition hover:text-green-700"
      >
        {lang === "ar" ? "تسجيل الدخول" : "Login"}
      </button>

      <button
        onClick={() => navigate("/campaign/login")}
        className="transition hover:text-green-700"
      >
        {lang === "ar" ? "حلول المولات" : "Mall Solutions"}
      </button>
    </div>

    {/* Right */}
    <div className="text-sm text-slate-400">
      © {new Date().getFullYear()} TrustedLinks
    </div>
  </div>
</footer>
      
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
