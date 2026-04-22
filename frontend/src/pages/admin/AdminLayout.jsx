import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Bell,
  Brain,
  ShieldAlert,
  Settings,
  LogOut,
  Globe,
  Menu,
  X,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import { useLang } from "../../context/LangContext.jsx";

export default function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang } = useLang();

  const [open, setOpen] = useState(true);

  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const navItems = useMemo(
    () => [
      {
        to: "/admin",
        icon: LayoutDashboard,
        label: t("Dashboard", "لوحة التحكم"),
        end: true,
      },
      {
        to: "/admin/businesses",
        icon: Building2,
        label: t("Businesses", "الأنشطة التجارية"),
      },

{
  to: "/admin/revenue",
  icon: CreditCard,
  label: t("Revenue", "الإيرادات"),
},
{
  to: "/admin/notifications",
  icon: Bell,
  label: t("Notifications", "الإشعارات"),
},
      {
        to: "/admin/insights",
        icon: Brain,
        label: t("Insights", "الرؤى والتحليلات"),
      },
      {
        to: "/admin/fraud",
        icon: ShieldAlert,
        label: t("Fraud Center", "مركز الاحتيال"),
        badge: t("Live", "مباشر"),
      },
      {
        to: "/admin/ai-summary",
        icon: Sparkles,
        label: t("AI Summary", "الملخص الذكي"),
      },
      {
        to: "/admin/settings",
        icon: Settings,
        label: t("Settings", "الإعدادات"),
      },
    ],
    [isAr]
  );

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const toggleLang = () => {
    const nextLang = isAr ? "en" : "ar";
    setLang(nextLang);
    localStorage.setItem("lang", nextLang);
    document.documentElement.lang = nextLang;
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
  };

  const currentPageLabel = useMemo(() => {
    const current =
      navItems.find((item) =>
        item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
      ) || navItems[0];

    return current?.label || t("Admin", "الإدارة");
  }, [location.pathname, navItems, isAr]);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`min-h-screen bg-gray-50 text-gray-800 ${
        isAr ? "flex flex-row-reverse" : "flex"
      }`}
    >
      <aside
        className={`${
          open ? "w-72" : "w-24"
        } shrink-0 border-gray-200 bg-white shadow-sm transition-all duration-300 ${
          isAr ? "border-l" : "border-r"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className={`flex items-center gap-3 overflow-hidden ${open ? "" : "justify-center w-full"}`}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <ShieldAlert size={22} />
                </div>

                {open && (
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-bold text-emerald-600">
                      {t("Trusted Links Admin", "إدارة Trusted Links")}
                    </h1>
                    <p className="truncate text-xs text-gray-500">
                      {t("Operations & Intelligence", "التشغيل والتحليلات الذكية")}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setOpen((v) => !v)}
                className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                title={t("Toggle sidebar", "إظهار أو إخفاء القائمة")}
              >
                {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {navItems.map(({ to, icon: Icon, label, end, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={!open ? label : undefined}
                className={({ isActive }) =>
                  [
                    "group flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition",
                    open ? "justify-between gap-3" : "justify-center",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  ].join(" ")
                }
              >
                <div className={`flex items-center ${open ? "gap-3" : ""}`}>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                      open ? "bg-transparent" : "bg-gray-50 group-hover:bg-white"
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  {open && <span className="truncate">{label}</span>}
                </div>

                {open && badge ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-gray-100 p-3">
            <div className="flex flex-col gap-2">
              <button
                onClick={toggleLang}
                className={`flex items-center rounded-2xl px-3 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 ${
                  open ? "gap-3" : "justify-center"
                }`}
                title={t("Switch language", "تبديل اللغة")}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                  <Globe size={18} />
                </div>
                {open && <span>{isAr ? "English" : "العربية"}</span>}
              </button>

              <button
                onClick={handleLogout}
                className={`flex items-center rounded-2xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 ${
                  open ? "gap-3" : "justify-center"
                }`}
                title={t("Logout", "تسجيل الخروج")}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <LogOut size={18} />
                </div>
                {open && <span>{t("Logout", "تسجيل الخروج")}</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                {t("Admin Panel", "لوحة الإدارة")}
              </p>
              <h2 className="truncate text-xl font-bold text-gray-900">{currentPageLabel}</h2>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                {t("Secure session", "جلسة آمنة")}
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600">
                {t("Admin tools active", "أدوات الإدارة مفعّلة")}
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
