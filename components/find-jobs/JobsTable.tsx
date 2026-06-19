import { Building2 } from "lucide-react";

export type Job = {
  id: string;
  company: string;
  role: string;
  matchScore: number;
  salary: string | null;
  dateFound: string;
};

type JobsTableProps = {
  jobs: Job[];
};

function scoreColorClasses(score: number): { text: string; bar: string } {
  if (score >= 90) return { text: "text-success", bar: "bg-success" };
  if (score >= 80) return { text: "text-info", bar: "bg-info" };
  return { text: "text-warning", bar: "bg-warning" };
}

export function JobsTable({ jobs }: JobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <Building2 className="h-6 w-6 text-text-muted" />
        <p className="text-sm text-text-muted">
          No jobs yet — search above to find your first matches.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-text-secondary">
              Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-text-secondary">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-text-secondary">
              Match Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-text-secondary">
              Salary Est.
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-text-secondary">
              Date Found
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const colors = scoreColorClasses(job.matchScore);
            return (
              <tr
                key={job.id}
                className="border-b border-border last:border-b-0 hover:bg-surface-secondary"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
                      <Building2 className="h-4 w-4 text-text-muted" />
                    </span>
                    <span className="text-sm font-medium text-text-primary">{job.company}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-text-primary">{job.role}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-1 w-16 overflow-hidden rounded-full bg-border-light">
                      <span
                        className={`block h-full rounded-full ${colors.bar}`}
                        style={{ width: `${job.matchScore}%` }}
                      />
                    </span>
                    <span className={`text-sm font-medium ${colors.text}`}>{job.matchScore}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-text-primary">
                  {job.salary ?? <span className="text-text-muted">Not specified</span>}
                </td>
                <td className="px-6 py-4 text-sm text-text-muted">{job.dateFound}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
