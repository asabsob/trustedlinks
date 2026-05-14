import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  Ticket,
  Users,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Globe,
} from "lucide-react";

import { useState } from "react";

export default function CampaignLayout() {
  const navigate = useNavigate();

  const [lang, setLang] = useState(
    localStorage.getItem("campaign_lang") || "en"
  );

  const owner = JSON.parse(
    localStorage.getItem("campaign_owner") || "{}"
  );

  const t = {
    en: {
      dashboard: "Dashboard",
      campaigns: "Campaigns",
      fundingCodes: "Funding Codes",
      participants: "Participants",
      finance: "Finance",
      analytics: "Analytics",
      settings: "Settings",
      logout: "Logout",
      welcome: "Welcome back",
      search: "Search campaigns...",
      campaignManagement:
        "Campaign Management",
      account: "Account",
      language: "العربية",
    },

    ar: {
      dashboard: "لوحة التحكم",
      campaigns: "الحملات",
      fundingCodes: "أكواد التمويل",
      participants: "المشاركون",
      finance: "المالية",
      analytics: "التحليلات",
      settings: "الإعدادات",
      logout: "تسجيل الخروج",
      welcome: "مرحبًا",
      search: "ابحث...",
      campaignManagement:
        "إدارة الحملات",
      account: "الحساب",
      language: "English",
    },
  };

  function toggleLang() {
    const newLang =
      lang === "en" ? "ar" : "en";

    setLang(newLang);

    localStorage.setItem(
      "campaign_lang",
      newLang
    );
  }

  function handleLogout() {
    localStorage.removeItem(
      "campaign_token"
    );

    localStorage.removeItem(
      "campaign_owner"
    );

    navigate("/campaign/login");
  }

 const navItems = [
  {
    to: "/campaign/dashboard",
    label: t[lang].dashboard,
    icon: LayoutDashboard,
  },

  {
    to: "/campaign/campaigns",
    label: t[lang].campaigns,
    icon: Megaphone,
  },

  {
    to: "/campaign/funding-codes",
    label: t[lang].fundingCodes,
    icon: Ticket,
  },

  {
    to: "/campaign/participants",
    label: t[lang].participants,
    icon: Users,
  },

  {
    to: "/campaign/finance",
    label: t[lang].finance,
    icon: Wallet,
  },

  {
    to: "/campaign/analytics",
    label: t[lang].analytics,
    icon: BarChart3,
  },

  {
    to: "/campaign/settings",
    label: t[lang].settings,
    icon: Settings,
  },
];

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-100 flex"
    >
      {/* SIDEBAR */}
      <aside className="w-[280px] bg-black text-white flex flex-col">
        {/* LOGO */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
              ✓
            </div>

            <div>
              <div className="font-bold text-xl">
                Trusted Links
              </div>

              <div className="text-xs text-slate-400">
                Campaign Platform
              </div>
            </div>
          </div>
        </div>

        {/* NAV */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-4 px-3">
            {t[lang].campaignManagement}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                      isActive
                        ? "bg-green-500 text-white"
                        : "hover:bg-white/10 text-slate-300"
                    }`
                  }
                >
                  <Icon size={20} />

                  <span className="font-medium">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>

      
        {/* FOOTER */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-red-500 text-white rounded-2xl py-3 transition"
          >
            <LogOut size={18} />

            <span>{t[lang].logout}</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <button className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center">
              <Menu size={20} />
            </button>

            <div className="hidden md:flex items-center bg-slate-100 rounded-2xl px-4 py-3 w-[380px]">
              <input
                placeholder={t[lang].search}
                className="bg-transparent outline-none w-full text-sm"
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-100 transition"
            >
              <Globe size={18} />

              <span className="text-sm font-medium">
                {t[lang].language}
              </span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center font-bold">
                {owner?.name?.charAt(0) ||
                  "C"}
              </div>

              <div className="hidden md:block">
                <div className="font-semibold text-sm">
                  {owner?.name ||
                    "Campaign"}
                </div>

                <div className="text-xs text-slate-500">
                  Campaign Owner
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
