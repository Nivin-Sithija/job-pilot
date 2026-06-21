import { redirect } from "next/navigation";

// 2. Internal imports
import { createInsforgeServer } from "@/lib/insforge-server";
import { calculateProfileCompletion, EMPTY_PROFILE, rowToProfile, type ProfileRow } from "@/lib/profile";
import { getStatsBarData, getRecentActivity } from "@/lib/dashboard";
import { getAnalyticsChartsData } from "@/lib/posthog-analytics";
import { PostHogIdentify } from "@/components/PostHogIdentify";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { IncompleteProfileBanner } from "@/components/dashboard/IncompleteProfileBanner";

// 3. Component
export default async function DashboardPage() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/login");
  }

  const userId = (data.user as { id?: string }).id ?? data.user.email;

  const [{ data: row }, stats, activities, analytics] = await Promise.all([
    insforge.database.from("profiles").select("*").eq("id", data.user.id).maybeSingle(),
    getStatsBarData(insforge, data.user.id),
    getRecentActivity(insforge, data.user.id),
    getAnalyticsChartsData(data.user.id),
  ]);

  // insforge.database.from() returns an untyped row — cast is safe since we selected "*" against the known schema
  const profileRow = row as ProfileRow | null;
  const profile = profileRow ? rowToProfile(profileRow) : EMPTY_PROFILE;
  const completion = calculateProfileCompletion(profile);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppNavbar active="Dashboard" />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-8 py-6">
        <PostHogIdentify userId={userId} />

        {!completion.isComplete ? (
          <IncompleteProfileBanner percentage={completion.percentage} />
        ) : null}

        <StatsBar stats={stats} />

        <div className="grid flex-1 content-stretch grid-cols-1 gap-4 lg:grid-cols-2">
          <RecentActivity activities={activities} />
          <AnalyticsCharts
            jobsOverTime={analytics.jobsOverTime}
            companyResearchActivity={analytics.companyResearchActivity}
            matchScoreDistribution={analytics.matchScoreDistribution}
            hasJobsOverTimeData={analytics.hasJobsOverTimeData}
            hasCompanyResearchData={analytics.hasCompanyResearchData}
            hasMatchScoreData={analytics.hasMatchScoreData}
          />
        </div>
      </main>
    </div>
  );
}
