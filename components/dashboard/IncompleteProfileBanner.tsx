import Link from "next/link";

type IncompleteProfileBannerProps = {
  percentage: number;
};

export function IncompleteProfileBanner({ percentage }: IncompleteProfileBannerProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-text-primary">
          Your profile is {percentage}% complete
        </p>
        <p className="text-sm text-text-secondary">
          Complete your profile to get more accurate job matches and company research.
        </p>
      </div>
      <Link
        href="/profile"
        className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        Complete Profile
      </Link>
    </div>
  );
}
