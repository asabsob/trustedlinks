import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

export default function Navbar({ lang, t, token, toggleLang, handleLogout }) {
  const isArabic = lang === "ar";
  const navigate = useNavigate();

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div
        className="container mx-auto flex items-center justify-between px-6 py-3"
        style={{ direction: isArabic ? "rtl" : "ltr" }}
      >
        {/* BRAND */}
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-lg text-gray-800"
        >
          <img src="/logo.svg" alt="Logo" className="h-6" />
          {t.brand}
        </Link>

        {/* CENTER NAVIGATION */}
        <div className="flex items-center gap-6">
          {!token ? (
            <>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `text-sm font-medium ${
                    isActive ? "text-green-600" : "text-gray-700 hover:text-green-600"
                  }`
                }
              >
                {t.nav.home}
              </NavLink>

              <NavLink
                to="/search"
                className={({ isActive }) =>
                  `text-sm font-medium ${
                    isActive ? "text-green-600" : "text-gray-700 hover:text-green-600"
                  }`
                }
              >
                {t.nav.search}
              </NavLink>

              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  `text-sm font-medium ${
                    isActive ? "text-green-600" : "text-gray-700 hover:text-green-600"
                  }`
                }
              >
                {t.nav.register}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-sm font-medium ${
                    isActive ? "text-green-600" : "text-gray-700 hover:text-green-600"
                  }`
                }
              >
                {t.nav.dashboard}
              </NavLink>

              <NavLink
                to="/manage"
                className={({ isActive }) =>
                  `text-sm font-medium ${
                    isActive ? "text-green-600" : "text-gray-700 hover:text-green-600"
                  }`
                }
              >
                {t.nav.manage}
              </NavLink>

              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  `text-sm font-medium ${
                    isActive ? "text-green-600" : "text-gray-700 hover:text-green-600"
                  }`
                }
              >
                {t.nav.reports}
              </NavLink>
            </>
          )}
        </div>

        {/* RIGHT BUTTONS */}
        <div className="flex items-center gap-3">
          {/* LANGUAGE SWITCH */}
          <button
            onClick={toggleLang}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-1.5"
          >
            {t.nav.arabic}
          </button>

          {/* LOGIN / LOGOUT */}
          {token ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg px-3 py-1.5"
            >
              {t.nav.logout}
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-3 py-1.5"
            >
              {t.nav.login}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}