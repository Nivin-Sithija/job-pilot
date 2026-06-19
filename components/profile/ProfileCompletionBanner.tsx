type ProfileCompletionBannerProps = {
  percentage: number;
  missingFields: { key: string; label: string }[];
};

export function ProfileCompletionBanner({
  percentage,
  missingFields,
}: ProfileCompletionBannerProps) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-text-primary">Profile needs attention</h2>
        <p className="text-sm text-text-secondary">
          Complete the missing fields to improve your chance of getting tailored matches and
          generating quality resumes.
        </p>
        <div className="flex gap-2">
          {missingFields.map((field) => (
            <span
              key={field.key}
              className="rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent"
            >
              {field.label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 64 64" className="h-20 w-20 -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="var(--color-border-light)"
            strokeWidth="6"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="var(--color-warning)"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base font-semibold text-text-primary">
          {percentage}%
        </div>
      </div>
    </div>
  );
}
