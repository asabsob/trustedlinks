import { useState } from "react";
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
  X,
} from "lucide-react";
import useIsMobile from "../../hooks/useIsMobile";

export default function CampaignLayout({ lang = "en" }) {
  const navigate = useNavigate();
  const isAr = lang === "ar";
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const owner = JSON.parse(localStorage.getItem("campaign_owner") || "{}");
  const token = localStorage.getItem("campaign_token");

  if (!token || token === "undefined" || token === "null") {
    navigate("/campaign/login");
  }

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
      search: "Search campaigns...",
      campaignManagement: "Partner Network",
      platform: "Partner Network",
      owner: "Campaign Owner",
    },
    ar: {
      dashboard: "لوحة التحكم",
      campaigns: "الحملات",
      fundingCodes: "أكواد الدعم",
      participants: "المشاركون",
      finance: "المالية",
      analytics: "التحليلات",
      settings: "الإعدادات",
      logout: "تسجيل الخروج",
      search: "ابحث...",
      campaignManagement: "شبكة الشركاء",
      platform: "شبكة الشركاء",
      owner: "مالك الحساب",
    },
  };

  function handleLogout() {
    localStorage.removeItem("campaign_token");
    localStorage.removeItem("campaign_owner");
    navigate("/campaign/login");
  }

  const navItems = [
    { to: "/campaign/dashboard", label: t[lang].dashboard, icon: LayoutDashboard },
    { to: "/campaign/campaigns", label: t[lang].campaigns, icon: Megaphone },
    { to: "/campaign/funding-codes", label: t[lang].fundingCodes, icon: Ticket },
    { to: "/campaign/participants", label: t[lang].participants, icon: Users },
    { to: "/campaign/finance", label: t[lang].finance, icon: Wallet },
    { to: "/campaign/analytics", label: t[lang].analytics, icon: BarChart3 },
    { to: "/campaign/settings", label: t[lang].settings, icon: Settings },
  ];

  const sidebar = (
    <aside className="w-[280px] max-w-[82vw] h-full bg-black text-white flex flex-col">
      <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
            ✓
          </div>

          <div>
            <div className="font-bold text-xl">Trusted Links</div>
            <div className="text-xs text-slate-400">{t[lang].platform}</div>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        )}
      </div>

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
                onClick={() => isMobile && setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                    isActive
                      ? "bg-green-500 text-white"
                      : "hover:bg-white/10 text-slate-300"
                  }`
                }
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

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
  );

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-100 flex overflow-hidden"
    >
      {!isMobile && sidebar}

      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="relative z-10 h-full">
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center shrink-0"
            >
              <Menu size={20} />
            </button>

            <div className="hidden md:flex items-center bg-slate-100 rounded-2xl px-4 py-3 w-[380px]">
              <input
                placeholder={t[lang].search}
                className="bg-transparent outline-none w-full text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0">
              {owner?.name?.charAt(0) || "C"}
            </div>

            <div className="hidden md:block">
              <div className="font-semibold text-sm">
                {owner?.name || "Campaign"}
              </div>
              <div className="text-xs text-slate-500">{t[lang].owner}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
