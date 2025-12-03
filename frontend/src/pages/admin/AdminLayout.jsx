import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Bell,
  Brain,
  Settings,
  LogOut,
  Globe,
  Menu,
  X,
} from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import { useLang } from "../../context/LangContext.jsx";

export default function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const { lang, setLang } = useLang();

  // ✅ Helper for bilingual text
  const t = (en, ar) => (lang === "ar" ? ar : en);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // ✅ Toggle language and persist it
  const toggleLang = () => {
    const nextLang = lang === "en" ? "ar" : "en";
    setLang(nextLang);
    localStorage.setItem("lang", nextLang);
    document.documentElement.lang = nextLang;
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
  };

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: t("Dashboard", "لوحة التحكم") },
    { to: "/admin/businesses", icon: Building2, label: t("Businesses", "الأنشطة التجارية") },
    { to: "/admin/subscriptions", icon: CreditCard, label: t("Subscriptions", "الاشتراكات") },
    { to: "/admin/notifications", icon: Bell, label: t("Notifications", "الإشعارات") },
    { to: "/admin/insights", icon: Brain, label: t("AI Insights", "تحليلات الذكاء الاصطناعي") },
    { to: "/admin/settings", icon: Settings, label: t("Settings", "الإعدادات") },
  ];

  return (
    <div
      className={`flex min-h-screen bg-gray-50 text-gray-800 ${
        lang === "ar" ? "flex-row-reverse" : "flex-row"
      }`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Sidebar */}
      <aside
        className={`${
          open ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 shadow-sm flex flex-col transition-all duration-300`}
      >
        {/* Header / Logo */}
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            {open && (
              <h1 className="font-semibold text-green-600 text-lg">
                {t("Trusted Links", "الروابط الموثوقة")}
              </h1>
            )}
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-gray-600"
            title={t("Toggle menu", "تبديل القائمة")}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-green-50 text-green-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Icon size={18} />
              {open && label}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 p-3 mt-auto flex flex-col gap-2">
          {/* 🌐 Language Toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            title={t("Switch Language", "تبديل اللغة")}
          >
            <Globe size={18} />
            {open && (lang === "ar" ? "English" : "العربية")}
          </button>

          {/* 🚪 Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={18} />
            {open && t("Logout", "تسجيل الخروج")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
