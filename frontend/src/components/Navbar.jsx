import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar({ lang, t, token, toggleLang, handleLogout }) {
  const dashboardPath = token ? "/dashboard" : "/login";
  const isArabic = lang === "ar";
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => setMobileOpen(false);

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? "text-green-600" : "text-gray-700 hover:text-green-600"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
      isActive
        ? "bg-green-50 text-green-700"
        : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
    }`;

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        <Link
          to="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-2 font-semibold text-base sm:text-lg text-gray-800 min-w-0"
        >
          <img src="/logo.svg" alt="Logo" className="h-7 w-7 shrink-0" />
          <span className="truncate">{t.brand}</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {!token ? (
            <>
              <NavLink to="/" className={navLinkClass}>
                {t.nav.home}
              </NavLink>

              <NavLink to="/search" className={navLinkClass}>
                {t.nav.search}
              </NavLink>

              <NavLink to="/signup" className={navLinkClass}>
                {t.nav.register}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to={dashboardPath} className={navLinkClass}>
                {t.nav.dashboard}
              </NavLink>

              <NavLink to="/manage" className={navLinkClass}>
                {t.nav.manage}
              </NavLink>

              <NavLink to="/reports" className={navLinkClass}>
                {t.nav.reports}
              </NavLink>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
          >
            {t.nav.arabic}
          </button>

          {token ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
            >
              {t.nav.logout}
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
            >
              {t.nav.login}
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-sm">
          <div
            className={`container mx-auto px-4 py-4 space-y-2 ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            {!token ? (
              <>
                <NavLink
                  to="/"
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  {t.nav.home}
                </NavLink>

                <NavLink
                  to="/search"
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  {t.nav.search}
                </NavLink>

                <NavLink
                  to="/signup"
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  {t.nav.register}
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to={dashboardPath}
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  {t.nav.dashboard}
                </NavLink>

                <NavLink
                  to="/manage"
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  {t.nav.manage}
                </NavLink>

                <NavLink
                  to="/reports"
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  {t.nav.reports}
                </NavLink>
              </>
            )}

            <div className="pt-3 flex flex-col gap-2">
              <button
                onClick={() => {
                  toggleLang();
                  closeMobileMenu();
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-2 transition-colors"
              >
                {t.nav.arabic}
              </button>

              {token ? (
                <button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg px-3 py-2 transition-colors"
                >
                  {t.nav.logout}
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="w-full text-center bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-2 transition-colors"
                >
                  {t.nav.login}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
