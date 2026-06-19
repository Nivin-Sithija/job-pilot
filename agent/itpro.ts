import type { createInsforgeServer } from "@/lib/insforge-server";
import { fetchRecentJobs, filterJobs, stripHtml } from "@/lib/itpro";
import { getPostHogClient } from "@/lib/posthog-server";
import type { Profile } from "@/lib/profile";
import { MATCH_THRESHOLD, MAX_JOBS_PER_RUN } from "@/lib/utils";
import { logAgentError } from "@/agent/logger";
import { scoreJobAgainstProfile } from "@/agent/matcher";

export async function discoverJobs(
  jobTitle: string,
  location: string,
  profile: Profile,
  runId: string,
  userId: string,
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>,
): Promise<
  { success: true; jobsFound: number; strongMatches: number } | { success: false; error: string }
> {
  try {
    const allJobs = await fetchRecentJobs(100);
    const matched = filterJobs(allJobs, jobTitle, location).slice(0, MAX_JOBS_PER_RUN);

    let strongMatches = 0;

    for (const job of matched) {
      const result = await scoreJobAgainstProfile(job, profile);
      if (!result.success) {
        await logAgentError(insforge, runId, userId, null, result.error);
        continue;
      }

      const { matchScore, matchReason, matchedSkills, missingSkills } = result.data;
      if (matchScore >= MATCH_THRESHOLD) strongMatches += 1;

      const { error: insertError } = await insforge.database.from("jobs").insert({
        run_id: runId,
        user_id: userId,
        source: "search",
        source_url: `https://itpro.lk/jobs/${job.id}`,
        external_apply_url: `https://itpro.lk/jobs/${job.id}`,
        title: job.title,
        company: job.company,
        location: null,
        salary: null,
        job_type: "fulltime",
        about_role: stripHtml(job.description),
        match_score: matchScore,
        match_reason: matchReason,
        matched_skills: matchedSkills,
        missing_skills: missingSkills,
        found_at: new Date().toISOString(),
      });

      if (insertError) {
        await logAgentError(insforge, runId, userId, null, insertError);
        continue;
      }

      getPostHogClient().capture({
        distinctId: userId,
        event: "job_found",
        properties: { userId, source: "search", matchScore },
      });
    }

    return { success: true, jobsFound: matched.length, strongMatches };
  } catch (error) {
    await logAgentError(insforge, runId, userId, null, error);
    return { success: false, error: String(error) };
  }
}
