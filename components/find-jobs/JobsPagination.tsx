"use client";

import { useRouter } from "next/navigation";

import { buildFindJobsUrl, type MatchFilter, type SortOption } from "@/lib/find-jobs";

type JobsPaginationProps = {
  from: number;
  to: number;
  total: number;
  currentPage: number;
  totalPages: number;
  query: string;
  match: MatchFilter;
  sort: SortOption;
};

export function JobsPagination({
  from,
  to,
  total,
  currentPage,
  totalPages,
  query,
  match,
  sort,
}: JobsPaginationProps) {
  const router = useRouter();
  const leadingPageNumbers = Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1);
  const showEllipsisAndLastPage = totalPages > leadingPageNumbers.length;

  function goToPage(page: number): void {
    router.push(buildFindJobsUrl({ query, match, sort, page }), { scroll: false });
  }

  function pageButtonClasses(page: number): string {
    return page === currentPage
      ? "rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
      : "rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary";
  }

  return (
    <div className="flex items-center justify-between px-2">
      <p className="text-sm text-text-secondary">
        Showing {from} to {to} of {total} results
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => goToPage(currentPage - 1)}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary disabled:opacity-50"
        >
          Previous
        </button>

        {leadingPageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => goToPage(page)}
            className={pageButtonClasses(page)}
          >
            {page}
          </button>
        ))}

        {showEllipsisAndLastPage && (
          <>
            <span className="px-1 text-sm text-text-muted">...</span>
            <button
              type="button"
              onClick={() => goToPage(totalPages)}
              className={pageButtonClasses(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => goToPage(currentPage + 1)}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
