import React, { useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

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
import ResetPassword from "./pages/ResetPassword.jsx";
import Wallet from "./pages/Wallet.jsx";
import Transactions from "./pages/Transactions.jsx";
import Terms from "./pages/Terms";

/* 🧭 Admin Pages */
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminAISummary from "./pages/admin/AdminAISummary.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminBusinesses from "./pages/admin/AdminBusinesses.jsx";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions.jsx";
import AdminNotifications from "./pages/admin/AdminNotifications.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";
import AdminFraud from "./pages/admin/AdminFraud.jsx";
import AdminInsights from "./pages/admin/AdminInsights.jsx";

/* 🔐 Admin Auth */
import { useAdminAuth } from "./context/AdminAuthContext.jsx";

/* ⭐ Navbar */
import Navbar from "./components/Navbar.jsx";

import CampaignLayout from "./layouts/CampaignLayout";

import CampaignLogin from "./pages/campaign/CampaignLogin";
import CampaignRegister from "./pages/campaign/CampaignRegister";
import CampaignDashboard from "./pages/campaign/CampaignDashboard";
import CampaignFundingCodes from "./pages/campaign/CampaignFundingCodes";
import CampaignCampaigns from "./pages/campaign/CampaignCampaigns";



// -------------------------
// User Protected Route
// -------------------------
function RequireAuth({ children }) {
const token = localStorage.getItem("trustedlinks_token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// -------------------------
// Admin Protected Route
// -------------------------
function PrivateAdmin({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return null;
  return admin ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const navigate = useNavigate();
 const token = localStorage.getItem("trustedlinks_token");

  const strings = useMemo(
    () => ({
      en: {
        brand: "Trusted Links",
       nav: {
  home: "Home",
  search: "Search",
  register: "Register Business",
  dashboard: "Dashboard",
  wallet: "Wallet",            // 👈 أضف هذا
  transactions: "Transactions",// 👈 أضف هذا
  manage: "Manage Links",
  reports: "Reports",
  logout: "Log Out",
  login: "Log In",
  arabic: "عربي",
},
      },
      ar: {
        brand: "ترستيد لينكس",
       nav: {
  home: "الرئيسية",
  search: "بحث",
  register: "تسجيل نشاط",
  dashboard: "لوحة التحكم",
  wallet: "المحفظة",        // 👈 أضف هذا
  transactions: "الحركات",  // 👈 أضف هذا
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
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  const handleLogout = () => {
  localStorage.removeItem("trustedlinks_token");
    localStorage.removeItem("pendingBusiness");
    localStorage.removeItem("otpToken");
    navigate("/", { replace: true });
    window.location.reload();
  };

  return (
    <div
      className={lang === "ar" ? "rtl" : ""}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <Navbar
        lang={lang}
        t={t}
        token={token}
        toggleLang={toggleLang}
        handleLogout={handleLogout}
      />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home lang={lang} />} />
        <Route path="/search" element={<Search lang={lang} />} />
        <Route path="/signup" element={<Signup lang={lang} />} />
        <Route path="/subscribe" element={<Subscribe lang={lang} />} />
      <Route path="/business/:id" element={<BusinessDetails lang={lang} />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/login" element={<LoginPage lang={lang} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword lang={lang} />} />
        <Route path="/terms" element={<Terms lang={lang} />} />
        
        {/* User Private */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard lang={lang} />
            </RequireAuth>
          }
        />
        <Route
          path="/manage"
          element={
            <RequireAuth>
              <ManageLinks lang={lang} />
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <Reports lang={lang} />
            </RequireAuth>
          }
        />
<Route
  path="/wallet"
  element={
    <RequireAuth>
      <Wallet lang={lang} />
    </RequireAuth>
  }
/>

<Route
  path="/transactions"
  element={
    <RequireAuth>
      <Transactions lang={lang} />
    </RequireAuth>
  }
/>

<Route
  path="/campaign/login"
  element={<CampaignLogin lang={lang} />}
/>

<Route
  path="/campaign/register"
  element={<CampaignRegister lang={lang} />}
/>
        
<Route
  path="/campaign"
  element={<CampaignLayout />}
>
  <Route
    index
    element={<Navigate to="dashboard" replace />}
  />

  <Route
    path="dashboard"
    element={<CampaignDashboard />}
  />

  <Route
    path="campaigns"
    element={<CampaignCampaigns />}
  />

  <Route
    path="funding-codes"
    element={<CampaignFundingCodes />}
  />

  <Route
  path="participants"
  element={<CampaignParticipants />}
/>
  
</Route>        
      {/* Admin Login */}
<Route path="/admin/login" element={<AdminLogin />} />

{/* Admin */}
<Route
  path="/admin"
  element={
    <PrivateAdmin>
      <AdminLayout />
    </PrivateAdmin>
  }
>
  <Route index element={<AdminDashboard />} />
  <Route path="businesses" element={<AdminBusinesses />} />
  <Route path="revenue" element={<AdminSubscriptions />} />
  <Route path="notifications" element={<AdminNotifications />} />
  <Route path="insights" element={<AdminInsights />} />
  <Route path="ai-summary" element={<AdminAISummary />} />
  <Route path="fraud" element={<AdminFraud />} />
  <Route path="settings" element={<AdminSettings />} />
</Route>
        {/* Fallback */} 
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="text-center mt-10 py-5 border-t border-gray-200 text-gray-500 text-sm">
        © {new Date().getFullYear()} Trusted Links
      </footer>
    </div>
  );
}
