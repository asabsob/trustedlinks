import React, { useEffect, useMemo, useState } from "react";

export default function Transactions({ lang = "en" }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  const t = useMemo(
    () => ({
      en: {
        title: "Transactions",
        subtitle: "Review all balance movements",
        all: "All",
        credits: "Credits",
        debits: "Debits",
        noTransactions: "No transactions found",
        type: "Type",
        amount: "Amount",
        reason: "Reason",
        date: "Date",
        reference: "Reference",
        credit: "Credit",
        debit: "Debit",
        failedLoad: "Failed to load transactions",
      },
      ar: {
        title: "كشف الحركات",
        subtitle: "مراجعة جميع حركات الرصيد",
        all: "الكل",
        credits: "الإيداعات",
        debits: "الخصومات",
        noTransactions: "لا توجد حركات",
        type: "النوع",
        amount: "المبلغ",
        reason: "السبب",
        date: "التاريخ",
        reference: "المرجع",
        credit: "إيداع",
        debit: "خصم",
        failedLoad: "فشل في تحميل الحركات",
      },
    }),
    []
  )[lang];

  useEffect(() => {
    document.title = lang === "ar" ? "كشف الحركات | Trusted Links" : "Transactions | Trusted Links";
    loadTransactions();
  }, [lang]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");
      const res = await fetch("/api/transactions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.transactions)
          ? data.transactions
          : [];
        setTransactions(list);
      } else {
        const demoTx = JSON.parse(localStorage.getItem("demo_transactions") || "[]");
        setTransactions(demoTx);
      }
    } catch (error) {
      setMessage(t.failedLoad);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "credit") return tx.type === "credit";
    if (filter === "debit") return tx.type === "debit";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t.title}</h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">{t.subtitle}</p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              filter === "all"
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            {t.all}
          </button>

          <button
            onClick={() => setFilter("credit")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              filter === "credit"
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            {t.credits}
          </button>

          <button
            onClick={() => setFilter("debit")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              filter === "debit"
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            {t.debits}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading...</div>
          ) : filteredTransactions.length === 0 ? (
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
                    <th className="px-3 py-3 font-medium">{t.reference}</th>
                    <th className="px-3 py-3 font-medium">{t.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
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
                        {Number(tx.amount || 0).toFixed(2)} JOD
                      </td>
                      <td className="px-3 py-3 text-slate-600">{tx.reason || "-"}</td>
                      <td className="px-3 py-3 text-slate-500">{tx.reference || tx.id || "-"}</td>
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
