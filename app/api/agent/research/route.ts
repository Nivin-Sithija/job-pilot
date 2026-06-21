import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createInsforgeServer } from "@/lib/insforge-server";
import { getPostHogClient } from "@/lib/posthog-server";
import { EMPTY_PROFILE, rowToProfile, type ProfileRow } from "@/lib/profile";
import { checkRateLimit } from "@/lib/rate-limit";
import { researchCompany } from "@/agent/research";

// One research run can burn 3-4 Gemini calls in quick succession (homepage extract + up to
// 3 sub-page act/extract pairs + synthesis) plus a full headless Chromium launch — capped
// tighter than Find Jobs because of that cost, and because the free-tier Gemini key has
// already hit its 5 req/min ceiling once during testing (see progress-tracker.md).
const RESEARCH_RATE_LIMIT = { maxRequests: 3, windowMs: 5 * 60 * 1000 };

const researchBodySchema = z.object({
  jobId: z.string().uuid(),
});

type JobRow = {
  id: string;
  company: string;
  website: string | null;
  about_role: string | null;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
};

export async function POST(req: NextRequest) {
  try {
    const insforge = await createInsforgeServer();
    const { data: authData } = await insforge.auth.getCurrentUser();
    if (!authData.user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }
    const userId = authData.user.id;

    const rateLimit = checkRateLimit(`research:${userId}`, RESEARCH_RATE_LIMIT.maxRequests, RESEARCH_RATE_LIMIT.windowMs);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many research requests. Try again in ${rateLimit.retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const parsedBody = researchBodySchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    const { jobId } = parsedBody.data;

    const { data: jobRow } = await insforge.database
      .from("jobs")
      .select("id, company, website, about_role, matched_skills, missing_skills")
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!jobRow) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
    const job = jobRow as JobRow;

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
        job_title_searched: null,
        location_searched: null,
        jobs_found: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError || !run) {
      console.error("[agent/research]", runError);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }

    const runId = (run as { id: string }).id;

    const result = await researchCompany(
      {
        id: job.id,
        company: job.company,
        website: job.website,
        aboutRole: job.about_role,
        matchedSkills: job.matched_skills,
        missingSkills: job.missing_skills,
      },
      profile,
      runId,
      userId,
      insforge,
    );

    // Always "completed" — agent_runs.status has a DB CHECK constraint limited to
    // running/completed/failed (see architecture.md), and a dossier was always produced
    // here even in the degraded case. `result.degraded` is carried in the response instead.
    await insforge.database
      .from("agent_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId)
      .eq("user_id", userId);

    const { error: updateError } = await insforge.database
      .from("jobs")
      .update({ company_research: result.dossier, researched_at: new Date().toISOString() })
      .eq("id", jobId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("[agent/research]", updateError);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }

    getPostHogClient().capture({
      distinctId: userId,
      event: "company_researched",
      properties: { userId, jobId, company: job.company },
    });

    return NextResponse.json({
      success: true,
      data: { dossier: result.dossier, degraded: result.degraded },
    });
  } catch (error) {
    console.error("[agent/research]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
