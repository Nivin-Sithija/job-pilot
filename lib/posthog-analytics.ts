import type { DayPoint, ScoreRangePoint } from "@/components/dashboard/AnalyticsCharts";

const JOBS_OVER_TIME_WINDOW_DAYS = 30;
const COMPANY_RESEARCH_WINDOW_DAYS = 7;

const MATCH_SCORE_BUCKETS: { range: string; min: number; max: number }[] = [
  { range: "50-60%", min: 50, max: 60 },
  { range: "60-70%", min: 60, max: 70 },
  { range: "70-80%", min: 70, max: 80 },
  { range: "80-90%", min: 80, max: 90 },
  { range: "90-100%", min: 90, max: 100 },
];

// distinct_id is always our own auth-generated userId (UUID), never raw user input —
// this is defense in depth since HogQL's query API has no documented parameter binding.
function escapeHogQLString(value: string): string {
  return value.replace(/'/g, "\\'");
}

function formatDayLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// Returns [] on any failure (missing credentials, network error, non-2xx) instead of
// throwing — a misconfigured/missing POSTHOG_PERSONAL_API_KEY should show the chart's
// empty state, not crash the Dashboard page.
async function runHogQLQuery<Row extends unknown[]>(query: string): Promise<Row[]> {
  // POSTHOG_API_HOST is the app host (e.g. https://us.posthog.com), not the same as
  // NEXT_PUBLIC_POSTHOG_HOST (https://us.i.posthog.com) — that's the ingestion-only host
  // used for event capture and accepts no authenticated reads.
  const url = `${process.env.POSTHOG_API_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/query/`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`PostHog query API error: ${response.status}`);
      return [];
    }

    const result = (await response.json()) as { results?: Row[] };
    return result.results ?? [];
  } catch (error) {
    console.error("PostHog query API request failed:", error);
    return [];
  }
}

async function getJobsFoundOverTime(userId: string): Promise<DayPoint[]> {
  const rows = await runHogQLQuery<[string, number]>(
    `SELECT toDate(timestamp) AS day, count() AS cnt
     FROM events
     WHERE event = 'job_found'
       AND distinct_id = '${escapeHogQLString(userId)}'
       AND timestamp >= now() - INTERVAL ${JOBS_OVER_TIME_WINDOW_DAYS} DAY
     GROUP BY day
     ORDER BY day`,
  );

  return rows.map(([day, cnt]) => ({ day: formatDayLabel(day), value: cnt }));
}

async function getCompanyResearchActivity(userId: string): Promise<DayPoint[]> {
  const rows = await runHogQLQuery<[string, number]>(
    `SELECT toDate(timestamp) AS day, count() AS cnt
     FROM events
     WHERE event = 'company_researched'
       AND distinct_id = '${escapeHogQLString(userId)}'
       AND timestamp >= now() - INTERVAL ${COMPANY_RESEARCH_WINDOW_DAYS} DAY
     GROUP BY day
     ORDER BY day`,
  );

  return rows.map(([day, cnt]) => ({ day: formatDayLabel(day), value: cnt }));
}

async function getMatchScoreDistribution(userId: string): Promise<ScoreRangePoint[]> {
  const rows = await runHogQLQuery<[number]>(
    `SELECT toFloat(properties.matchScore) AS score
     FROM events
     WHERE event = 'job_found'
       AND distinct_id = '${escapeHogQLString(userId)}'`,
  );

  const scores = rows.map(([score]) => score);

  return MATCH_SCORE_BUCKETS.map(({ range, min, max }) => ({
    range,
    value: scores.filter((score) => (max === 100 ? score >= min && score <= max : score >= min && score < max))
      .length,
  }));
}

export type AnalyticsChartsData = {
  jobsOverTime: DayPoint[];
  companyResearchActivity: DayPoint[];
  matchScoreDistribution: ScoreRangePoint[];
  hasJobsOverTimeData: boolean;
  hasCompanyResearchData: boolean;
  hasMatchScoreData: boolean;
};

export async function getAnalyticsChartsData(userId: string): Promise<AnalyticsChartsData> {
  const [jobsOverTime, companyResearchActivity, matchScoreDistribution] = await Promise.all([
    getJobsFoundOverTime(userId),
    getCompanyResearchActivity(userId),
    getMatchScoreDistribution(userId),
  ]);

  return {
    jobsOverTime,
    companyResearchActivity,
    matchScoreDistribution,
    hasJobsOverTimeData: jobsOverTime.some((point) => point.value > 0),
    hasCompanyResearchData: companyResearchActivity.some((point) => point.value > 0),
    hasMatchScoreData: matchScoreDistribution.some((point) => point.value > 0),
  };
}
