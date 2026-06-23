import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  ShieldCheck,
  AlertTriangle,
  Clock3,
  RefreshCcw,
  Globe,
} from "lucide-react";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function AdminCampaignOwners() {
  const { lang } = useLang();
  const { token } = useAdminAuth();
  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [owners, setOwners] = useState([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [country, setCountry] = useState(
    localStorage.getItem("adminCountry") || "JO"
  );

  const countries = [
    { code: "all", name: t("All Countries", "كل الدول"), currency: "JOD" },
    { code: "JO", name: t("Jordan", "الأردن"), currency: "JOD" },
    { code: "SA", name: t("Saudi Arabia", "السعودية"), currency: "SAR" },
    { code: "AE", name: t("UAE", "الإمارات"), currency: "AED" },
    { code: "QA", name: t("Qatar", "قطر"), currency: "QAR" },
  ];

  const currency =
    countries.find((item) => item.code === country)?.currency || "JOD";

  useEffect(() => {
    loadOwners(false);
  }, [token, country]);

  async function loadOwners(silent = false) {
    const adminToken =
      token ||
      localStorage.getItem("admintoken") ||
      localStorage.getItem("admin_token") ||
      localStorage.getItem("adminToken");

    if (!adminToken) {
      setError(t("Admin token missing.", "توكن الأدمن غير موجود."));
      setLoading(false);
      return;
    }

    try {
      silent ? setRefreshing(true) : setLoading(true);
      setError("");

      localStorage.setItem("adminCountry", country);

      const countryParam = country === "all" ? "" : `?country=${country}`;

      const res = await fetch(
        `${API_BASE}/api/admin/campaign-owners${countryParam}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to load campaign owners");
      }

      const list = data.owners || data.campaignOwners || data.data || [];
      setOwners(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(
        err.message ||
          t(
            "Failed to load campaign owners.",
            "فشل في تحميل حسابات الممولين."
          )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const normalizedOwners = useMemo(() => {
    return owners.map((owner) => {
      const status = String(owner.status || "").toLowerCase();

      return {
        ...owner,
        id: owner.id,
        name: owner.name || "-",
        email: owner.email || "-",
        phone: owner.phone || "-",
        username: owner.username || "-",
        country: owner.country || owner.country_code || "-",
        city: owner.city || "-",
        entityType: owner.entity_type || owner.entityType || "-",
        status,
        createdAt: owner.created_at || owner.createdAt,
        walletBalance: Number(owner.wallet_balance || owner.walletBalance || 0),
       sponsoredBudget: Number(owner.sponsored_budget || 0),
usedBudget: Number(owner.used_budget || 0),
remainingBudget: Number(owner.remaining_budget || 0),
campaignsCount: Number(owner.campaigns_count || 0),
activeCampaigns: Number(owner.active_campaigns || 0),
pendingCampaigns: Number(owner.pending_campaigns || 0),
currency: owner.currency || "JOD",
      };
    });
  }, [owners]);

  const filteredOwners = useMemo(() => {
    const query = q.trim().toLowerCase();

    if (!query) return normalizedOwners;

    return normalizedOwners.filter((owner) =>
      [
        owner.name,
        owner.email,
        owner.phone,
        owner.username,
        owner.country,
        owner.city,
        owner.entityType,
        owner.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [normalizedOwners, q]);

  const total = normalizedOwners.length;
  const active = normalizedOwners.filter((o) =>
    ["active", "approved"].includes(o.status)
  ).length;
  const pending = normalizedOwners.filter((o) =>
    ["pending", "review", "under_review"].includes(o.status)
  ).length;
  const suspended = normalizedOwners.filter((o) =>
    ["suspended", "rejected", "blocked"].includes(o.status)
  ).length;

  function statusLabel(status) {
    if (["active", "approved"].includes(status)) return t("Active", "نشط");
    if (["pending", "review", "under_review"].includes(status))
      return t("Pending", "معلق");
    if (["suspended", "blocked"].includes(status)) return t("Suspended", "موقوف");
    if (status === "rejected") return t("Rejected", "مرفوض");
    return status || t("Unknown", "غير معروف");
  }

  function statusStyle(status) {
    if (["active", "approved"].includes(status)) {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (["pending", "review", "under_review"].includes(status)) {
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }

    if (["suspended", "rejected", "blocked"].includes(status)) {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-slate-50 text-slate-700 border-slate-200";
  }

  const formatMoney = (value, rowCurrency = currency) =>
  `${Number(value || 0).toFixed(2)} ${rowCurrency}`;

  if (loading) {
    return (
      <div
        dir={isAr ? "rtl" : "ltr"}
        className={`p-4 sm:p-6 ${isAr ? "text-right" : "text-left"}`}
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          {t("Loading campaign owners...", "جارٍ تحميل حسابات الممولين...")}
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`space-y-5 sm:space-y-6 ${isAr ? "text-right" : "text-left"}`}
    >
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-green-600 p-4 text-white shadow-lg sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold">
              {t("Admin Management", "إدارة الأدمن")}
            </div>

            <h1 className="text-2xl font-extrabold md:text-4xl">
              {t("Campaign Owners", "الممولون")}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
              {t(
                "Manage sponsor accounts, review their status, and monitor campaign owner records from one place.",
                "إدارة حسابات الممولين، مراجعة حالتهم، ومتابعة سجلاتهم من مكان واحد."
              )}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-sm">
              <Globe size={16} />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-transparent text-white outline-none [&>option]:text-gray-900"
              >
                {countries.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl bg-white/15 px-4 py-2 text-sm">
              {t("Currency", "العملة")}: {currency}
            </div>

            <button
              onClick={() => loadOwners(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              <RefreshCcw size={16} />
              {refreshing
                ? t("Refreshing...", "جارٍ التحديث...")
                : t("Refresh", "تحديث")}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Building2}
          title={t("Total Owners", "إجمالي الممولين")}
          value={total}
        />
        <StatCard
          icon={ShieldCheck}
          title={t("Active", "نشط")}
          value={active}
          color="text-green-600"
        />
        <StatCard
          icon={Clock3}
          title={t("Pending", "معلق")}
          value={pending}
          color="text-yellow-600"
        />
        <StatCard
          icon={AlertTriangle}
          title={t("Suspended / Rejected", "موقوف / مرفوض")}
          value={suspended}
          color="text-red-600"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t("Sponsor Accounts", "حسابات الممولين")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t(
                "Search and review campaign owner accounts.",
                "ابحث وراجع حسابات ممولي الحملات."
              )}
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:w-[380px]">
            <Search size={17} className="shrink-0 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t(
                "Search by name, email, phone, city...",
                "ابحث بالاسم، البريد، الهاتف، المدينة..."
              )}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {filteredOwners.length === 0 ? (
          <div className="py-14 text-center text-slate-500">
            {t("No campaign owners found.", "لا توجد حسابات ممولين.")}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="p-4 text-start">{t("Name", "الاسم")}</th>
                    <th className="p-4 text-start">{t("Email", "البريد")}</th>
                    <th className="p-4 text-start">{t("Phone", "الهاتف")}</th>
                    <th className="p-4 text-start">{t("Location", "الموقع")}</th>
                    <th className="p-4 text-start">{t("Entity", "النوع")}</th>
                    <th className="p-4 text-start">{t("Status", "الحالة")}</th>
                    <th className="p-4 text-start">{t("Budget", "الميزانية")}</th>
                    <th className="p-4 text-start">{t("Used", "المستخدم")}</th>
                    <th className="p-4 text-start">{t("Remaining", "المتبقي")}</th>
                    <th className="p-4 text-start">{t("Campaigns", "الحملات")}</th>
                    <th className="p-4 text-start">{t("Created", "تاريخ الإنشاء")}</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOwners.map((owner) => (
                    <tr
                      key={owner.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="p-4 font-semibold text-slate-900">
                        {owner.name}
                      </td>
                      <td className="p-4 text-slate-600">{owner.email}</td>
                      <td className="p-4 text-slate-600">{owner.phone}</td>
                      <td className="p-4 text-slate-600">
                        {[owner.city, owner.country].filter(Boolean).join(", ") ||
                          "-"}
                      </td>
                      <td className="p-4 text-slate-600">{owner.entityType}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(
                            owner.status
                          )}`}
                        >
                          {statusLabel(owner.status)}
                        </span>
                      </td>
                   <td className="p-4 font-semibold text-emerald-700">
  {formatMoney(owner.sponsoredBudget, owner.currency)}
</td>

<td className="p-4 font-semibold text-amber-700">
  {formatMoney(owner.usedBudget, owner.currency)}
</td>

<td className="p-4 font-semibold text-blue-700">
  {formatMoney(owner.remainingBudget, owner.currency)}
</td>

<td className="p-4 text-slate-600">
  {owner.campaignsCount}
</td>

<td className="p-4 text-slate-500">
  {owner.createdAt
    ? new Date(owner.createdAt).toLocaleDateString(
        isAr ? "ar" : "en"
      )
    : "-"}
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {filteredOwners.map((owner) => (
                <div
                  key={owner.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-900">
                        {owner.name}
                      </div>
                      <div className="mt-1 break-all text-sm text-slate-500">
                        {owner.email}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(
                        owner.status
                      )}`}
                    >
                      {statusLabel(owner.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <MobileRow label={t("Phone", "الهاتف")} value={owner.phone} />
                    <MobileRow
                      label={t("Location", "الموقع")}
                      value={
                        [owner.city, owner.country].filter(Boolean).join(", ") ||
                        "-"
                      }
                    />
                    <MobileRow
                      label={t("Entity", "النوع")}
                      value={owner.entityType}
                    />
                    <MobileRow
                      label={t("Budget", "الميزانية")}
                      value={formatMoney(owner.sponsoredBudget, owner.currency)}
                    />
               <MobileRow
  label={t("Used", "المستخدم")}
  value={formatMoney(owner.usedBudget, owner.currency)}
/>

<MobileRow
  label={t("Remaining", "المتبقي")}
  value={formatMoney(owner.remainingBudget, owner.currency)}
/>

<MobileRow
  label={t("Campaigns", "الحملات")}
  value={owner.campaignsCount}
/>
            
                    <MobileRow
                      label={t("Created", "تاريخ الإنشاء")}
                      value={
                        owner.createdAt
                          ? new Date(owner.createdAt).toLocaleDateString(
                              isAr ? "ar" : "en"
                            )
                          : "-"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color = "text-slate-900" }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">{title}</div>
          <div className={`mt-2 text-3xl font-extrabold ${color}`}>
            {Number(value || 0)}
          </div>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function MobileRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
      <span className="text-slate-500">{label}</span>
      <span className="break-all text-right font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}
