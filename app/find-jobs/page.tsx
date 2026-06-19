import { redirect } from "next/navigation";

import { createInsforgeServer } from "@/lib/insforge-server";
import { formatRelativeTime, MATCH_THRESHOLD } from "@/lib/utils";
import { parseMatchFilter, parseSortOption } from "@/lib/find-jobs";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsTable, type Job } from "@/components/find-jobs/JobsTable";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";

const JOBS_PER_PAGE = 20;

type JobRow = {
  id: string;
  company: string;
  title: string;
  match_score: number | null;
  salary: string | null;
  found_at: string;
};

type FindJobsPageProps = {
  searchParams: Promise<{ q?: string; match?: string; sort?: string; page?: string }>;
};

// PostgREST's `or()` filter list is comma-separated and `%`/`_` are ilike wildcards —
// strip them from user input so a search term can't break the filter syntax.
function escapeForIlike(value: string): string {
  return value.replace(/[%_,]/g, "");
}

export default async function FindJobsPage({ searchParams }: FindJobsPageProps) {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const match = parseMatchFilter(params.match);
  const sort = parseSortOption(params.sort);
  const currentPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  let dbQuery = insforge.database
    .from("jobs")
    .select("id, company, title, match_score, salary, found_at", { count: "exact" })
    .eq("user_id", data.user.id);

  if (match === "high") {
    dbQuery = dbQuery.gte("match_score", MATCH_THRESHOLD);
  } else if (match === "low") {
    dbQuery = dbQuery.lt("match_score", MATCH_THRESHOLD);
  }

  if (query.length > 0) {
    const needle = escapeForIlike(query);
    dbQuery = dbQuery.or(`company.ilike.%${needle}%,title.ilike.%${needle}%`);
  }

  if (sort === "score") {
    dbQuery = dbQuery.order("match_score", { ascending: false });
  } else if (sort === "oldest") {
    dbQuery = dbQuery.order("found_at", { ascending: true });
  } else {
    dbQuery = dbQuery.order("found_at", { ascending: false });
  }

  const from = (currentPage - 1) * JOBS_PER_PAGE;
  const { data: rows, count } = await dbQuery.range(from, from + JOBS_PER_PAGE - 1);

  const jobs: Job[] = ((rows ?? []) as JobRow[]).map((row) => ({
    id: row.id,
    company: row.company,
    role: row.title,
    matchScore: row.match_score ?? 0,
    salary: row.salary,
    dateFound: formatRelativeTime(row.found_at),
  }));

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / JOBS_PER_PAGE));

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar active="Find Jobs" />
      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-8 py-8">
        <SearchControls />
        <JobFilters query={query} match={match} sort={sort} />
        <JobsTable jobs={jobs} />
        {total > 0 && (
          <JobsPagination
            from={from + 1}
            to={Math.min(from + JOBS_PER_PAGE, total)}
            total={total}
            currentPage={currentPage}
            totalPages={totalPages}
            query={query}
            match={match}
            sort={sort}
          />
        )}
      </main>
    </div>
  );
}
