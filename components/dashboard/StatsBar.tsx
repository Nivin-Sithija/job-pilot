type StatCard = {
  label: string;
  value: string;
  trend?: string;
  subtitle?: string;
};

type StatsBarProps = {
  stats: StatCard[];
};

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-border bg-surface p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
        >
          <p className="text-sm text-text-secondary">{stat.label}</p>
          <p className="mt-1 text-3xl font-semibold text-text-primary">{stat.value}</p>
          <div className="mt-2 flex items-center gap-2">
            {stat.trend ? (
              <span className="rounded-sm bg-success-lightest px-2 py-0.5 text-xs font-medium text-success-darker">
                {stat.trend}
              </span>
            ) : null}
            {stat.trend ? (
              <span className="text-xs text-text-muted">vs last week</span>
            ) : (
              <span className="text-xs text-text-muted">{stat.subtitle}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export type { StatCard };
