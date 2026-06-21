import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createInsforgeServer } from "@/lib/insforge-server";
import { getPostHogClient } from "@/lib/posthog-server";
import { EMPTY_PROFILE, rowToProfile, type ProfileRow } from "@/lib/profile";
import { checkRateLimit } from "@/lib/rate-limit";
import { discoverJobs } from "@/agent/itpro";

const findJobsBodySchema = z.object({
  jobTitle: z.string().min(1),
  location: z.string(),
});

// Scoring runs sequentially against Gemini (one call per job, up to MAX_JOBS_PER_RUN), so a
// burst of searches in a short window can still queue dozens of calls — capped looser than
// Research since it has no browser-automation cost, but still bounded.
const FIND_JOBS_RATE_LIMIT = { maxRequests: 5, windowMs: 5 * 60 * 1000 };

export async function POST(req: NextRequest) {
  try {
    const insforge = await createInsforgeServer();
    const { data: authData } = await insforge.auth.getCurrentUser();
    if (!authData.user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }
    const userId = authData.user.id;

    const rateLimit = checkRateLimit(`find:${userId}`, FIND_JOBS_RATE_LIMIT.maxRequests, FIND_JOBS_RATE_LIMIT.windowMs);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many search requests. Try again in ${rateLimit.retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const parsedBody = findJobsBodySchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    const { jobTitle, location } = parsedBody.data;

    const { data: profileRow } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    const profile = profileRow ? rowToProfile(profileRow as ProfileRow) : EMPTY_PROFILE;

    const { data: run, error: runError } = await insforge.database
      .from("agent_runs")
      .insert({
        user_id: userId,
        status: "running",
        job_title_searched: jobTitle,
        location_searched: location,
        jobs_found: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError || !run) {
      console.error("[agent/find]", runError);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }

    const runId = (run as { id: string }).id;

    getPostHogClient().capture({
      distinctId: userId,
      event: "job_search_started",
      properties: { userId, jobTitle, location },
    });

    const result = await discoverJobs(jobTitle, location, profile, runId, userId, insforge);

    await insforge.database
      .from("agent_runs")
      .update({
        status: result.success ? "completed" : "failed",
        jobs_found: result.success ? result.jobsFound : 0,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId)
      .eq("user_id", userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Job search failed. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { jobsFound: result.jobsFound, strongMatches: result.strongMatches },
    });
  } catch (error) {
    console.error("[agent/find]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
