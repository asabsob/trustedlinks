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
  Menu,
  X,
} from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import { useLang } from "../../context/LangContext.jsx";

import BrandLogo from "../../components/BrandLogo";

export default function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const { lang, toggleLang } = useLang();
  const [open, setOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const t = (en, ar) => (lang === "ar" ? ar : en);

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: t("Dashboard", "لوحة التحكم") },
    { to: "/admin/businesses", icon: Building2, label: t("Businesses", "الأنشطة التجارية") },
    { to: "/admin/subscriptions", icon: CreditCard, label: t("Subscriptions", "الاشتراكات") },
    { to: "/admin/notifications", icon: Bell, label: t("Notifications", "الإشعارات") },
    { to: "/admin/insights", icon: Brain, label: t("AI Insights", "تحليلات الذكاء الاصطناعي") },
    { to: "/admin/settings", icon: Settings, label: t("Settings", "الإعدادات") },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Sidebar */}
      <aside
        className={`${
          open ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 shadow-sm flex flex-col transition-all duration-300`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
         <div className="flex items-center gap-2 min-w-0">
  {open ? (
    <BrandLogo lang={lang} className="h-10 w-auto max-w-[170px]" />
  ) : (
    <img src="/logo.svg" alt="Trusted Links" className="h-7 w-7" />
  )}
</div>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-gray-600 hover:text-green-600"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-green-50 text-green-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Icon size={18} />
              {open && label}
            </NavLink>
          ))}
        </nav>

        {/* Footer Buttons */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          <button
  onClick={toggleLang}
  className="m-3 flex items-center gap-2 p-2 rounded-lg text-gray-600 hover:bg-gray-100"
>
  🌐 {lang === "ar" ? "English" : "العربية"}
</button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-200 py-2 rounded-lg hover:bg-red-50"
          >
            <LogOut size={18} /> {open && t("Logout", "تسجيل الخروج")}
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
