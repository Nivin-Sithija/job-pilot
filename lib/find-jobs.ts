export type MatchFilter = "all" | "high" | "low";
export type SortOption = "newest" | "oldest" | "score";

export function parseMatchFilter(value: string | undefined): MatchFilter {
  return value === "high" || value === "low" ? value : "all";
}

export function parseSortOption(value: string | undefined): SortOption {
  return value === "score" || value === "oldest" ? value : "newest";
}

type FindJobsUrlParams = {
  query: string;
  match: MatchFilter;
  sort: SortOption;
  page?: number;
};

// Defaults (all/newest/page 1) are omitted from the URL so the unfiltered view stays at a clean /find-jobs.
export function buildFindJobsUrl({ query, match, sort, page = 1 }: FindJobsUrlParams): string {
  const params = new URLSearchParams();
  if (query.trim().length > 0) params.set("q", query.trim());
  if (match !== "all") params.set("match", match);
  if (sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));

  const queryString = params.toString();
  return queryString.length > 0 ? `/find-jobs?${queryString}` : "/find-jobs";
}
