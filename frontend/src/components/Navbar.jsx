import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

export default function Navbar({ lang, t, token, toggleLang, handleLogout }) {
  const navigate = useNavigate();
  const isArabic = lang === "ar";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div
        className="container mx-auto flex items-center justify-between px-4 py-3"
        style={{ direction: isArabic ? "rtl" : "ltr" }}
      >
        {/* LOGO + BRAND */}
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-gray-800">
          <img src="/logo.svg" alt="Logo" className="h-7" />
          <span className="whitespace-nowrap">{t.brand}</span>
        </Link>

        {/* MOBILE MENU BUTTON */}
        <button
          className="sm:hidden text-3xl text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden sm:flex items-center gap-6">
          {!token ? (
            <>
              <NavItem to="/" label={t.nav.home} />
              <NavItem to="/search" label={t.nav.search} />
              <NavItem to="/signup" label={t.nav.register} />
            </>
          ) : (
            <>
              <NavItem to="/dashboard" label={t.nav.dashboard} />
              <NavItem to="/manage" label={t.nav.manage} />
              <NavItem to="/reports" label={t.nav.reports} />
            </>
          )}
        </div>

        {/* DESKTOP RIGHT BUTTONS */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg px-3 py-1.5"
          >
            {t.nav.arabic}
          </button>

          {token ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg px-3 py-1.5"
            >
              {t.nav.logout}
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg px-3 py-1.5"
            >
              {t.nav.login}
            </button>
          )}
        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div
          className="sm:hidden bg-white border-t px-4 py-4 flex flex-col gap-4"
          style={{ direction: isArabic ? "rtl" : "ltr" }}
        >
          {!token ? (
            <>
              <MobileItem to="/" label={t.nav.home} onClick={() => setMenuOpen(false)} />
              <MobileItem to="/search" label={t.nav.search} onClick={() => setMenuOpen(false)} />
              <MobileItem to="/signup" label={t.nav.register} onClick={() => setMenuOpen(false)} />
            </>
          ) : (
            <>
              <MobileItem to="/dashboard" label={t.nav.dashboard} onClick={() => setMenuOpen(false)} />
              <MobileItem to="/manage" label={t.nav.manage} onClick={() => setMenuOpen(false)} />
              <MobileItem to="/reports" label={t.nav.reports} onClick={() => setMenuOpen(false)} />
            </>
          )}

          <button
            onClick={() => {
              toggleLang();
              setMenuOpen(false);
            }}
            className="bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg px-3 py-1.5 w-24"
          >
            {t.nav.arabic}
          </button>

          {token ? (
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg px-3 py-1.5 w-24"
            >
              {t.nav.logout}
            </button>
          ) : (
            <button
              onClick={() => {
                navigate("/login");
                setMenuOpen(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg px-3 py-1.5 w-24"
            >
              {t.nav.login}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

/* === COMPONENTS === */

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `text-sm font-medium whitespace-nowrap ${
          isActive ? "text-green-600" : "text-gray-700 hover:text-green-600"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function MobileItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className="text-gray-700 text-base hover:text-green-600 whitespace-nowrap"
    >
      {label}
    </NavLink>
  );
}
