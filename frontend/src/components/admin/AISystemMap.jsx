const SERVICES = [
  {
    name: "Search Service",
    dependsOn: ["Supabase", "AI Parser"],
    status: "Monitored",
  },
  {
    name: "WhatsApp Service",
    dependsOn: ["JAVNA"],
    status: "Monitored",
  },
  {
    name: "Billing Service",
    dependsOn: ["Supabase"],
    status: "Monitored",
  },
  {
    name: "AI Operations Service",
    dependsOn: ["OpenAI", "Supabase"],
    status: "Monitored",
  },
  {
    name: "Fraud Detection",
    dependsOn: ["Lead Locks", "Fingerprinting"],
    status: "Monitored",
  },
];

export default function AISystemMap({ lang = "ar" }) {
  const isAr = lang === "ar";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">
        {isAr ? "خريطة النظام الذكية" : "AI System Map"}
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        {isAr
          ? "توضح هذه الخريطة الخدمات الأساسية وما تعتمد عليه كل خدمة."
          : "This map shows core services and their dependencies."}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SERVICES.map((service) => (
          <div key={service.name} className="rounded-2xl border border-slate-200 p-5">
            <div className="font-bold text-slate-900">{service.name}</div>

            <div className="mt-3 text-sm text-slate-500">
              {isAr ? "يعتمد على:" : "Depends on:"}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {service.dependsOn.map((dep) => (
                <span
                  key={dep}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {dep}
                </span>
              ))}
            </div>

            <div className="mt-4 text-xs font-bold text-green-700">
              {service.status}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
