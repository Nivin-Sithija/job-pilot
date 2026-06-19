"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { buildFindJobsUrl, type MatchFilter, type SortOption } from "@/lib/find-jobs";

const SEARCH_DEBOUNCE_MS = 400;

type JobFiltersProps = {
  query: string;
  match: MatchFilter;
  sort: SortOption;
};

export function JobFilters({ query, match, sort }: JobFiltersProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);

  // Keep the field in sync when the URL changes from elsewhere (e.g. browser back/forward).
  // Adjusted during render rather than in an effect, per React's recommended pattern for
  // resetting state when a prop changes — avoids an extra render-then-sync cascade.
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setSearchInput(query);
  }

  useEffect(() => {
    if (searchInput === query) return;
    const timeout = setTimeout(() => {
      router.replace(buildFindJobsUrl({ query: searchInput, match, sort }), { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput, query, match, sort, router]);

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Filter by company or role..."
          className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={match}
          onChange={(e) =>
            router.replace(
              buildFindJobsUrl({ query, match: e.target.value as MatchFilter, sort }),
              { scroll: false },
            )
          }
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="all">All Matches</option>
          <option value="high">High Match</option>
          <option value="low">Low Match</option>
        </select>
        <select
          value={sort}
          onChange={(e) =>
            router.replace(
              buildFindJobsUrl({ query, match, sort: e.target.value as SortOption }),
              { scroll: false },
            )
          }
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="score">Match Score</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
    </div>
  );
}
