type ActivityType = "job_found" | "company_researched";

type ActivityItem = {
  id: string;
  type: ActivityType;
  text: string;
  timestamp: string;
};

type RecentActivityProps = {
  activities: ActivityItem[];
};

const dotClasses: Record<ActivityType, { outer: string; inner: string }> = {
  job_found: { outer: "bg-success-light", inner: "bg-success-alt" },
  company_researched: { outer: "bg-accent-light", inner: "bg-accent" },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>
      {activities.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No activity yet.</p>
      ) : (
        <ul className="mt-2 flex flex-1 flex-col justify-evenly">
          {activities.map((activity) => {
            const dot = dotClasses[activity.type];
            return (
              <li key={activity.id} className="flex items-center gap-3 border-t border-border py-3 first:border-t-0">
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${dot.outer}`}>
                  <span className={`h-2 w-2 rounded-full ${dot.inner}`} />
                </span>
                <div className="flex flex-1 items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-text-primary">{activity.text}</p>
                  <p className="shrink-0 text-xs text-text-muted">{activity.timestamp}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export type { ActivityItem, ActivityType };
