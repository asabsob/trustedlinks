import React, { useMemo, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

/* 🌍 Public + User Pages */
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ManageLinks from "./pages/ManageLinks.jsx";
import Reports from "./pages/Reports.jsx";
import Signup from "./pages/Signup.jsx";
import Subscribe from "./pages/Subscribe.jsx";
import BusinessDetails from "./pages/BusinessDetails.jsx";
import ForgotPassword from "./pages/ForgotPassword";
import LoginPage from "./pages/LoginPage.jsx";

/* 🧭 Admin Pages */
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminAISummary from "./pages/admin/AdminAISummary.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminBusinesses from "./pages/admin/AdminBusinesses.jsx";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions.jsx";
import AdminNotifications from "./pages/admin/AdminNotifications.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";

/* 🔐 Admin Auth */
import {
  AdminAuthProvider,
  useAdminAuth,
} from "./context/AdminAuthContext.jsx";

/* ⭐ Navbar */
import Navbar from "./components/Navbar.jsx";

// Admin Protected Route
function PrivateAdmin({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return null;
  return admin ? children : <Navigate to="/admin/login" replace />;
}

// MAIN APP
export default function App() {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Protect private user pages
  if (!token && ["/dashboard", "/manage", "/reports"].includes(location.pathname)) {
    window.location.href = "/";
  }

  // Language Strings
  const strings = useMemo(
    () => ({
      en: {
        brand: "Trusted Links",
        nav: {
          home: "Home",
          search: "Search",
          register: "Register Business",
          dashboard: "Dashboard",
          manage: "Manage Links",
          reports: "Reports",
          logout: "Log Out",
          login: "Log In",
          arabic: "عربي",
        },
      },
      ar: {
        brand: "ترستيت لينكس",
        nav: {
          home: "الرئيسية",
          search: "بحث",
          register: "تسجيل نشاط",
          dashboard: "لوحة التحكم",
          manage: "إدارة الروابط",
          reports: "التقارير",
          logout: "تسجيل الخروج",
          login: "تسجيل الدخول",
          arabic: "EN",
        },
      },
    }),
    []
  );

  const t = strings[lang];

  const toggleLang = () => {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
    window.location.reload();
  };

  return (
    <div
      className={lang === "ar" ? "rtl" : ""}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* 🌟 ALWAYS SHOW NAVBAR (header visible even on /login) */}
      <Navbar
        lang={lang}
        t={t}
        token={token}
        toggleLang={toggleLang}
        handleLogout={handleLogout}
      />

      <AdminAuthProvider>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home lang={lang} />} />
          <Route path="/search" element={<Search lang={lang} />} />
          <Route path="/signup" element={<Signup lang={lang} />} />
          <Route path="/subscribe" element={<Subscribe lang={lang} />} />
          <Route path="/business/:id" element={<BusinessDetails />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />

          {/* Login Page (opens modal) */}
          <Route path="/login" element={<LoginPage lang={lang} />} />

          {/* Forgot Password */}
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin Pages */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <PrivateAdmin>
                <AdminLayout />
              </PrivateAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="businesses" element={<AdminBusinesses />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="insights" element={<AdminAISummary />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* User Private Pages */}
          {token && (
            <>
              <Route path="/dashboard" element={<Dashboard lang={lang} />} />
              <Route path="/manage" element={<ManageLinks lang={lang} />} />
              <Route path="/reports" element={<Reports lang={lang} />} />
            </>
          )}
        </Routes>
      </AdminAuthProvider>

      {/* Footer */}
      <footer className="text-center mt-10 py-5 border-t border-gray-200 text-gray-500 text-sm">
        © {new Date().getFullYear()} Trusted Links
      </footer>
    </div>
  );
}
