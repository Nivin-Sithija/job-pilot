import { Briefcase, Building2, Calendar, DollarSign, ExternalLink, MapPin } from "lucide-react";

import { scoreColorClasses } from "@/lib/utils";

type JobInfoProps = {
  title: string;
  company: string;
  matchScore: number;
  salary: string | null;
  location: string | null;
  jobType: string | null;
  foundAt: string;
  sourceUrl: string;
};

export function JobInfo({
  title,
  company,
  matchScore,
  salary,
  location,
  jobType,
  foundAt,
  sourceUrl,
}: JobInfoProps) {
  const scoreColors = scoreColorClasses(matchScore);

  const infoItems = [
    { icon: DollarSign, label: "Salary Est.", value: salary ?? "—" },
    { icon: MapPin, label: "Location", value: location ?? "—" },
    { icon: Briefcase, label: "Job Type", value: jobType ?? "—" },
    { icon: Calendar, label: "Date Found", value: foundAt },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
            <Building2 className="h-6 w-6 text-text-muted" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
            <p className="text-sm text-text-secondary">{company}</p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary"
          >
            View Job Post
            <ExternalLink className="h-4 w-4" />
          </a>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${scoreColors.badgeBg} ${scoreColors.badgeText}`}
          >
            {matchScore}% Match Score
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {infoItems.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
              <Icon className="h-4 w-4 text-text-muted" />
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
