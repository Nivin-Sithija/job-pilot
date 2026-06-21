export const MATCH_THRESHOLD = 70;

// Caps sequential Gemini scoring calls per search run — a broad job title match
// against the 100-job ITPro.lk batch could otherwise queue dozens of calls in a row.
export const MAX_JOBS_PER_RUN = 20;

export function scoreColorClasses(score: number): {
  text: string;
  bar: string;
  badgeBg: string;
  badgeText: string;
} {
  if (score > 80) {
    return {
      text: "text-success",
      bar: "bg-success",
      badgeBg: "bg-success-lightest",
      badgeText: "text-success-foreground",
    };
  }
  if (score >= 70) {
    return {
      text: "text-info",
      bar: "bg-info",
      badgeBg: "bg-info-lightest",
      badgeText: "text-info-foreground",
    };
  }
  return { text: "text-warning", bar: "bg-warning", badgeBg: "bg-warning/10", badgeText: "text-warning" };
}

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}
