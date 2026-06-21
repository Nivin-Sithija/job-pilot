import type { createInsforgeServer } from "@/lib/insforge-server";
import type { StatCard } from "@/components/dashboard/StatsBar";
import type { ActivityItem } from "@/components/dashboard/RecentActivity";
import { formatRelativeTime } from "@/lib/utils";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_ACTIVITY_LIMIT = 5;

export async function getStatsBarData(
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>,
  userId: string,
): Promise<StatCard[]> {
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

  const [totalJobs, matchScores, companiesResearched, jobsThisWeek] = await Promise.all([
    insforge.database.from("jobs").select("*", { count: "exact", head: true }).eq("user_id", userId),
    insforge.database.from("jobs").select("match_score").eq("user_id", userId),
    insforge.database
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("company_research", "is", null),
    insforge.database
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("found_at", sevenDaysAgo),
  ]);

  const scores = ((matchScores.data ?? []) as { match_score: number | null }[])
    .map((row) => row.match_score)
    .filter((score): score is number => score !== null);
  const avgMatchRate = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

  return [
    { label: "Total Jobs Found", value: String(totalJobs.count ?? 0), subtitle: "All time" },
    { label: "Avg. Match Rate", value: `${avgMatchRate}%`, subtitle: "Across all jobs" },
    { label: "Companies Researched", value: String(companiesResearched.count ?? 0), subtitle: "Total researched" },
    { label: "Jobs This Week", value: String(jobsThisWeek.count ?? 0), subtitle: "New this week" },
  ];
}

type AgentRunRow = {
  id: string;
  job_title_searched: string | null;
  jobs_found: number | null;
  completed_at: string | null;
  started_at: string;
};

type ResearchedJobRow = {
  id: string;
  company: string;
  researched_at: string;
};

export async function getRecentActivity(
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>,
  userId: string,
): Promise<ActivityItem[]> {
  const [searchRuns, researchedJobs] = await Promise.all([
    insforge.database
      .from("agent_runs")
      .select("id, job_title_searched, jobs_found, completed_at, started_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("job_title_searched", "is", null)
      .order("completed_at", { ascending: false })
      .limit(RECENT_ACTIVITY_LIMIT),
    insforge.database
      .from("jobs")
      .select("id, company, researched_at")
      .eq("user_id", userId)
      .not("researched_at", "is", null)
      .order("researched_at", { ascending: false })
      .limit(RECENT_ACTIVITY_LIMIT),
  ]);

  type SortableActivity = ActivityItem & { occurredAt: string };

  const jobFoundActivities: SortableActivity[] = ((searchRuns.data ?? []) as AgentRunRow[]).map((run) => ({
    id: run.id,
    type: "job_found",
    text: `Found ${run.jobs_found ?? 0} jobs for ${run.job_title_searched}`,
    timestamp: formatRelativeTime(run.completed_at ?? run.started_at),
    occurredAt: run.completed_at ?? run.started_at,
  }));

  const companyResearchedActivities: SortableActivity[] = ((researchedJobs.data ?? []) as ResearchedJobRow[]).map(
    (job) => ({
      id: job.id,
      type: "company_researched",
      text: `Researched ${job.company}`,
      timestamp: formatRelativeTime(job.researched_at),
      occurredAt: job.researched_at,
    }),
  );

  return [...jobFoundActivities, ...companyResearchedActivities]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT)
    .map(({ id, type, text, timestamp }) => ({ id, type, text, timestamp }));
}
