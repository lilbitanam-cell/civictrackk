interface StatsBandProps {
  stats: {
    total: number;
    active: number;
    resolved: number;
    resolutionRate: number;
    departmentsCount: number;
  };
}

export function StatsBand({ stats }: StatsBandProps) {
  const items = [
    {
      label: "Reports Logged",
      value: stats.total.toLocaleString("en-IN"),
      note: "Filed by residents in the ledger",
    },
    {
      label: "Active Dispatches",
      value: stats.active.toLocaleString("en-IN"),
      note: "Under review or in field progress",
    },
    {
      label: "Verified Resolutions",
      value: stats.resolved.toLocaleString("en-IN"),
      note: `${stats.resolutionRate}% documented completion rate`,
    },
    {
      label: "Municipal Divisions",
      value: stats.departmentsCount.toLocaleString("en-IN"),
      note: "Active departments connected",
    },
  ];

  return (
    <section
      aria-label="Live civic statistics"
      className="bg-[#ECE9DF]/65 border-b border-[#DDD9CE]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DDD9CE]">
          {items.map((item) => (
            <div key={item.label} className="py-6 sm:px-6 first:pl-0 last:pr-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#77796F]">
                {item.label}
              </p>
              <p className="font-serif text-3xl sm:text-4xl font-semibold text-[#1B3A2E] mt-1.5 tracking-tight">
                {item.value}
              </p>
              <p className="text-xs text-[#77796F] mt-1">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
