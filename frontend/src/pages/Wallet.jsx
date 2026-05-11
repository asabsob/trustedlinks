import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function Wallet({ lang = "en" }) {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState("active");
  const [sponsoredBalance, setSponsoredBalance] = useState(0);
const [sponsoredStatus, setSponsoredStatus] = useState("none");
const [totalAvailableBalance, setTotalAvailableBalance] = useState(0);
  const [topupAmount, setTopupAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [submitting, setSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const businessId = localStorage.getItem("businessId") || "";

  const t = useMemo(
    () => ({
      en: {
        title: "Wallet",
        subtitle: "Manage your balance and review recent activity",
        currentBalance: "Current Balance",
        accountStatus: "Account Status",
        active: "Active",
        low: "Low Balance",
        paused: "Paused",
        out: "Out of Balance",
        addBalance: "Add Balance",
        quickTopUp: "Quick Top Up",
        enterAmount: "Enter amount",
        topup: "Top Up",
        recentTransactions: "Recent Transactions",
        noTransactions: "No transactions yet",
        type: "Type",
        amount: "Amount",
        reason: "Reason",
        date: "Date",
        credit: "Credit",
        debit: "Debit",
        topupSuccess: "Balance added successfully",
        invalidAmount: "Please enter a valid amount",
        failedLoad: "Failed to load wallet data",
        lowWarning: "Your balance is low. Recharge soon to keep receiving leads.",
        outWarning: "Your balance is finished. Recharge now to keep your business active.",
        packageLabel: "Recommended packages",
        customAmount: "Custom amount",
        confirmPayment: "Confirm Payment",
        confirmDemoPayment: "Confirm Top-up",
        orderCreated: "Top-up order created. Please confirm payment to continue.",
        confirmPaymentFailed: "Failed to confirm payment.",
        cancel: "Cancel",
      },
      ar: {
        title: "المحفظة",
        subtitle: "إدارة الرصيد ومراجعة آخر الحركات",
        currentBalance: "الرصيد الحالي",
        accountStatus: "حالة الحساب",
        active: "نشط",
        low: "رصيد منخفض",
        paused: "موقوف",
        out: "منتهي الرصيد",
        addBalance: "شحن الرصيد",
        quickTopUp: "شحن سريع",
        enterAmount: "أدخل المبلغ",
        topup: "شحن",
        recentTransactions: "آخر الحركات",
        noTransactions: "لا توجد حركات بعد",
        type: "النوع",
        amount: "المبلغ",
        reason: "السبب",
        date: "التاريخ",
        credit: "إيداع",
        debit: "خصم",
        topupSuccess: "تم شحن الرصيد بنجاح",
        invalidAmount: "الرجاء إدخال مبلغ صحيح",
        failedLoad: "فشل في تحميل بيانات المحفظة",
        lowWarning: "رصيدك منخفض. يرجى الشحن قريبًا للاستمرار في استقبال الطلبات.",
        outWarning: "الرصيد منتهي. اشحن الآن للحفاظ على نشاطك فعالًا.",
        packageLabel: "باقات مقترحة",
        customAmount: "مبلغ مخصص",
        confirmPayment: "تأكيد الدفع",
       confirmDemoPayment: "تأكيد الشحن ",
        orderCreated: "تم إنشاء طلب الشحن. قم بتأكيد الدفع للمتابعة.",
        confirmPaymentFailed: "فشل تأكيد الدفع.",
        cancel: "إلغاء",
      },
    }),
    []
  )[lang];

 const quickPackages = useMemo(() => [5, 10, 15, 20], []);
  const isSponsoredTenant =
  sponsoredStatus === "active";

  useEffect(() => {
    document.title =
      lang === "ar" ? "المحفظة | Trusted Links" : "Wallet | Trusted Links";
    loadWallet();
  }, [lang]);

  const inferStatus = (value) => {
    if (value <= 0) return "out";
    if (value < 5) return "low";
    return "active";
  };

  const loadWallet = async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("info");

      const token = localStorage.getItem("token");
      const businessId = localStorage.getItem("businessId") || "";

      if (!token) {
        setMessage("You are not logged in");
        setMessageType("error");
        return;
      }

      if (!businessId) {
        setMessage("businessId missing");
        setMessageType("error");
        return;
      }

     const [bizRes, txRes] = await Promise.all([
  fetch(`${API_BASE}/api/business/me`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }),
  fetch(`${API_BASE}/api/business/transactions/${businessId}?limit=10`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }),
]);

      const bizData = await bizRes.json().catch(() => null);
      const txData = await txRes.json().catch(() => null);

      if (!bizRes.ok) {
        throw new Error(bizData?.error || "Failed to load wallet");
      }

     const paidBalance = Number(bizData?.wallet_balance || 0);

const sponsored = Number(
  bizData?.sponsored_balance || 0
);

const total = Number(
  bizData?.total_available_balance ||
  paidBalance + sponsored
);

setBalance(paidBalance);
setSponsoredBalance(sponsored);
setSponsoredStatus(
  bizData?.sponsored_status || "none"
);

setTotalAvailableBalance(total);

setCurrency(
  bizData?.wallet_currency || "USD"
);

setStatus(
  bizData?.wallet_status ||
  inferStatus(total)
);

      if (txRes.ok) {
        const txList = Array.isArray(txData)
          ? txData
          : Array.isArray(txData?.transactions)
          ? txData.transactions
          : [];
        setTransactions(txList);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("loadWallet error:", error);
      setMessage(t.failedLoad);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (value) => {
    if (value === "out") return t.out;
    if (value === "low") return t.low;
    if (value === "paused") return t.paused;
    return t.active;
  };

  const getStatusClasses = (value) => {
    if (value === "out") return "bg-red-100 text-red-700";
    if (value === "low") return "bg-yellow-100 text-yellow-700";
    if (value === "paused") return "bg-gray-200 text-gray-700";
    return "bg-green-100 text-green-700";
  };

  const getMessageClasses = () => {
    if (messageType === "error") {
      return "border-red-200 bg-red-50 text-red-700";
    }
    if (messageType === "success") {
      return "border-green-200 bg-green-50 text-green-700";
    }
    return "border-slate-200 bg-white text-slate-700";
  };

  const submitTopup = async (amountValue) => {
    const amount = Number(amountValue);

    const token = localStorage.getItem("token");
    const businessId = localStorage.getItem("businessId") || "";

    if (!token) {
      setMessage("You are not logged in");
      setMessageType("error");
      return;
    }

    if (!businessId) {
      setMessage("businessId missing");
      setMessageType("error");
      return;
    }

    if (!amount || amount <= 0) {
      setMessage(t.invalidAmount);
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("info");

      const res = await fetch(`${API_BASE}/api/payments/create-topup-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, businessId }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
  if (data?.reason === "TOPUP_LIMIT_EXCEEDED") {
    const remaining = Number(data?.remainingAllowed || 0);

    const msg =
      lang === "ar"
        ? `الحد التجريبي للشحن هو 20$. المتبقي لك: ${remaining.toFixed(2)}`
        : `Trial limit is $20. Remaining allowed: ${remaining.toFixed(2)}`;

    throw new Error(msg);
  }

  throw new Error(data?.error || "Failed to create topup order");
}

      setPendingOrder(data);
      setMessage(t.orderCreated);
      setMessageType("success");
    } catch (error) {
      console.error("submitTopup error:", error);
      setMessage(error.message || t.failedLoad);
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const getOrCreateIdempotencyKey = (orderId) => {
  if (!orderId) return "";

  const storageKey = `topup_confirm_idem_${orderId}`;
  let key = localStorage.getItem(storageKey);

  if (!key) {
    key =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(storageKey, key);
  }

  return key;
};

const clearIdempotencyKey = (orderId) => {
  if (!orderId) return;
  localStorage.removeItem(`topup_confirm_idem_${orderId}`);
};
  
const confirmPendingPayment = async () => {
  if (!pendingOrder?.orderId) return;

  try {
    setSubmitting(true);

    const token = localStorage.getItem("token");
    const idempotencyKey = getOrCreateIdempotencyKey(pendingOrder.orderId);


const res = await fetch(`${API_BASE}/api/payments/confirm-topup-order`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({ orderId: pendingOrder.orderId }),
});

    if (res && res.ok) {
      const data = await res.json();
      const nextBalance = Number(data.balance || 0);

      setBalance(nextBalance);
      setCurrency(data.currency || currency || "USD");
      setStatus(data.status || inferStatus(nextBalance));
      clearIdempotencyKey(pendingOrder.orderId);
      setPendingOrder(null);
      setTopupAmount("");
      setMessage(t.topupSuccess);
      setMessageType("success");
      await loadWallet();
      return;
    }

    const errorData = await res?.json?.().catch(() => null);

    setMessage(errorData?.error || t.confirmPaymentFailed);
    setMessageType("error");
  } catch (error) {
    setMessage(t.failedLoad);
    setMessageType("error");
  } finally {
    setSubmitting(false);
  }
};
  
  const handleTopup = async (e) => {
    e.preventDefault();
    await submitTopup(topupAmount);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            {t.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">{t.subtitle}</p>
        </div>

        {(status === "low" || status === "out") && (
          <div
            className={`mb-6 rounded-xl border p-4 text-sm shadow-sm ${
              status === "out"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-yellow-200 bg-yellow-50 text-yellow-800"
            }`}
          >
            {status === "out" ? t.outWarning : t.lowWarning}
          </div>
        )}

        {message && (
          <div
            className={`mb-6 rounded-xl border p-4 text-sm shadow-sm ${getMessageClasses()}`}
          >
            {message}
          </div>
        )}

        {pendingOrder && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              {t.confirmPayment}
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              {lang === "ar"
                ? `طلب شحن بقيمة ${pendingOrder.amount} ${pendingOrder.currency}`
                : `Top-up order for ${pendingOrder.amount} ${pendingOrder.currency}`}
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={confirmPendingPayment}
                disabled={submitting}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "..." : t.confirmDemoPayment}
              </button>

              <button
                type="button"
                onClick={() => setPendingOrder(null)}
                disabled={submitting}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">{t.currentBalance}</p>
               <div className="mt-2">
  <h2 className="text-3xl font-bold text-slate-900">
    {loading
      ? "..."
      : `${totalAvailableBalance.toFixed(2)} ${currency}`}
  </h2>

  <div className="mt-2 space-y-1 text-sm">
    <div className="text-slate-600">
      {lang === "ar"
        ? `الرصيد المدفوع: ${balance.toFixed(2)} ${currency}`
        : `Paid Balance: ${balance.toFixed(2)} ${currency}`}
    </div>

    {isSponsoredTenant && sponsoredBalance > 0 && (
  <div className="text-green-700 font-medium">
    {lang === "ar"
      ? `الرصيد المقدم من المول: ${sponsoredBalance.toFixed(2)} ${currency}`
      : `Mall Sponsored Credit: ${sponsoredBalance.toFixed(2)} ${currency}`}
  </div>
)}

{isSponsoredTenant && sponsoredBalance <= 0 && (
  <div className="text-slate-500 font-medium">
    {lang === "ar"
      ? "حساب مدعوم ضمن برنامج المول"
      : "Account enrolled in mall sponsorship program"}
  </div>
)}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{t.accountStatus}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                    status
                  )}`}
                >
                  {getStatusLabel(status)}
                </span>
              </div>
            </div>

       <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
  {lang === "ar"
    ? "سيتم تفعيل خيارات الشحن التجاري قريباً."
    : "Commercial recharge options will be available soon."}
</div>

</div>
{!isSponsoredTenant ? (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="mb-2 text-lg font-semibold text-slate-900">
      {lang === "ar" ? "الشحن غير متاح حالياً" : "Top-up unavailable"}
    </h3>

    <p className="text-sm text-slate-600 leading-7">
      {lang === "ar"
        ? "رصيد البداية المجاني هو 5 فقط. سيتم تفعيل خيارات الشحن التجاري قريباً."
        : "The free starting balance is 5 only. Commercial recharge options will be available soon."}
    </p>
  </div>
) : (
  <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-green-800">
      {lang === "ar" ? "رصيد برعاية المول" : "Mall Sponsored Balance"}
    </h3>

    <p className="mt-2 text-sm text-green-700 leading-7">
      {lang === "ar"
        ? "رصيدك مقدم ضمن برنامج دعم متاجر المول. لا حاجة للشحن خلال فترة الرعاية."
        : "Your balance is provided under the mall tenant support program. No recharge is needed during the sponsorship period."}
    </p>
  </div>
)}
</div>
          </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              {t.recentTransactions}
            </h3>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
              {t.noTransactions}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-3 font-medium">{t.type}</th>
                    <th className="px-3 py-3 font-medium">{t.amount}</th>
                    <th className="px-3 py-3 font-medium">{t.reason}</th>
                    <th className="px-3 py-3 font-medium">{t.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-100">
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            tx.type === "credit"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tx.type === "credit" ? t.credit : t.debit}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium">
                        {Number(tx.amount || 0).toFixed(2)} {tx.currency || currency}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{tx.reason || "-"}</td>
                      <td className="px-3 py-3 text-slate-500">
                        {tx.date ? new Date(tx.date).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
