import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function Wallet({ lang = "en" }) {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState("active");
  const [topupAmount, setTopupAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [submitting, setSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

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
      },
    }),
    []
  )[lang];

  const quickPackages = useMemo(() => [10, 25, 50, 100], []);

  useEffect(() => {
    document.title = lang === "ar" ? "المحفظة | Trusted Links" : "Wallet | Trusted Links";
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

      const [balanceRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/api/balance`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => null),
        fetch(`${API_BASE}/api/transactions?limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => null),
      ]);

      let balanceData = null;
      let txData = null;

      if (balanceRes && balanceRes.ok) {
        balanceData = await balanceRes.json();
      }

      if (txRes && txRes.ok) {
        txData = await txRes.json();
      }

      if (balanceData) {
        const nextBalance = Number(balanceData.balance || 0);
        setBalance(nextBalance);
        setCurrency(balanceData.currency || "USD");
        setStatus(balanceData.status || inferStatus(nextBalance));
      } else {
        const demoBalance = Number(localStorage.getItem("demo_balance") || 12.5);
        const demoCurrency = localStorage.getItem("demo_currency") || "USD";
        setBalance(demoBalance);
        setCurrency(demoCurrency);
        setStatus(inferStatus(demoBalance));
      }

      if (txData) {
        const txList = Array.isArray(txData)
          ? txData
          : Array.isArray(txData.transactions)
          ? txData.transactions
          : [];
        setTransactions(txList);
      } else {
        const demoTx = JSON.parse(localStorage.getItem("demo_transactions") || "[]");
        setTransactions(demoTx.slice(0, 10));
      }
    } catch (error) {
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

  if (!amount || amount <= 0) {
    setMessage(t.invalidAmount);
    setMessageType("error");
    return;
  }

  try {
    setSubmitting(true);
    setMessage("");
    setMessageType("info");

    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/api/payments/create-topup-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ amount }),
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      setPendingOrder(data);
      setMessage(
        lang === "ar"
          ? "تم إنشاء طلب الشحن. قم بتأكيد الدفع للمتابعة."
          : "Top-up order created. Please confirm payment to continue."
      );
      setMessageType("success");
      return;
    }

    setMessage(t.failedLoad);
    setMessageType("error");
  } catch (error) {
    setMessage(t.failedLoad);
    setMessageType("error");
  } finally {
    setSubmitting(false);
  }
};

  const confirmPendingPayment = async () => {
  if (!pendingOrder?.orderId) return;

  try {
    setSubmitting(true);

    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/api/payments/confirm-topup-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ orderId: pendingOrder.orderId }),
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      const nextBalance = Number(data.balance || 0);

      setBalance(nextBalance);
      setCurrency(data.currency || currency || "USD");
      setStatus(data.status || inferStatus(nextBalance));
      setPendingOrder(null);
      setTopupAmount("");
      setMessage(t.topupSuccess);
      setMessageType("success");
      await loadWallet();
      return;
    }

    setMessage(
      lang === "ar"
        ? "فشل تأكيد الدفع."
        : "Failed to confirm payment."
    );
    setMessageType("error");
  } catch (error) {
    setMessage(t.failedLoad);
    setMessageType("error");
  } finally {
    setSubmitting(false);
  }
};

    <h3 className="text-lg font-semibold text-slate-900">
      {lang === "ar" ? "تأكيد الدفع" : "Confirm Payment"}
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
        {submitting
          ? "..."
          : lang === "ar"
          ? "تأكيد الدفع التجريبي"
          : "Confirm Demo Payment"}
      </button>

      <button
        type="button"
        onClick={() => setPendingOrder(null)}
        disabled={submitting}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {lang === "ar" ? "إلغاء" : "Cancel"}
      </button>
    </div>
  </div>
)}

  const handleTopup = async (e) => {
    e.preventDefault();
    await submitTopup(topupAmount);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t.title}</h1>
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
  <div className={`mb-6 rounded-xl border p-4 text-sm shadow-sm ${getMessageClasses()}`}>
    {message}
  </div>
)}

{pendingOrder && (
  <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-900">
      {lang === "ar" ? "تأكيد الدفع" : "Confirm Payment"}
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
        {submitting
          ? "..."
          : lang === "ar"
          ? "تأكيد الدفع التجريبي"
          : "Confirm Demo Payment"}
      </button>

      <button
        type="button"
        onClick={() => setPendingOrder(null)}
        disabled={submitting}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {lang === "ar" ? "إلغاء" : "Cancel"}
      </button>
    </div>
  </div>
)}

<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm text-slate-500">{t.currentBalance}</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          {loading ? "..." : `${balance.toFixed(2)} ${currency}`}
        </h2>
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

    <div className="mt-6">
      <p className="mb-3 text-sm font-medium text-slate-700">{t.packageLabel}</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickPackages.map((pkg) => (
          <button
            key={pkg}
            type="button"
            disabled={submitting}
            onClick={() => submitTopup(pkg)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            +{pkg} {currency}
          </button>
        ))}
      </div>
    </div>
  </div>

  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="mb-2 text-lg font-semibold text-slate-900">{t.addBalance}</h3>
    <p className="mb-4 text-sm text-slate-500">{t.customAmount}</p>

    <form onSubmit={handleTopup} className="space-y-4">
      <input
        type="number"
        min="1"
        step="0.01"
        value={topupAmount}
        onChange={(e) => setTopupAmount(e.target.value)}
        placeholder={t.enterAmount}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "..." : t.topup}
      </button>
    </form>
  </div>
</div>

<div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="mb-4 flex items-center justify-between">
    <h3 className="text-lg font-semibold text-slate-900">{t.recentTransactions}</h3>
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
