export const MATCH_THRESHOLD = 70;

// Caps sequential Gemini scoring calls per search run — a broad job title match
// against the 100-job ITPro.lk batch could otherwise queue dozens of calls in a row.
export const MAX_JOBS_PER_RUN = 20;

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
