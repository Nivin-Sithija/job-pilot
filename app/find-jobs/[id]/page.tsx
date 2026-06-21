import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createInsforgeServer } from "@/lib/insforge-server";
import { formatRelativeTime } from "@/lib/utils";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { JobInfo } from "@/components/job-details/JobInfo";
import { MatchScore } from "@/components/job-details/MatchScore";
import { JobDescription } from "@/components/job-details/JobDescription";
import { CompanyResearch } from "@/components/job-details/CompanyResearch";
import { JobActions } from "@/components/job-details/JobActions";
import type { CompanyDossier } from "@/agent/types";

type JobRow = {
  id: string;
  title: string;
  company: string;
  website: string | null;
  location: string | null;
  salary: string | null;
  job_type: string | null;
  source_url: string;
  external_apply_url: string;
  about_role: string | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  nice_to_have: string[] | null;
  benefits: string[] | null;
  about_company: string | null;
  match_score: number | null;
  match_reason: string | null;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
  company_research: CompanyDossier | null;
  found_at: string;
};

type JobDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/login");
  }

  const { id } = await params;

  const { data: row } = await insforge.database
    .from("jobs")
    .select(
      "id, title, company, website, location, salary, job_type, source_url, external_apply_url, about_role, responsibilities, requirements, nice_to_have, benefits, about_company, match_score, match_reason, matched_skills, missing_skills, company_research, found_at",
    )
    .eq("id", id)
    .eq("user_id", data.user.id)
    .maybeSingle();

  const job = row as JobRow | null;

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar active="Find Jobs" />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-8">
        <Link
          href="/find-jobs"
          className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>

        <JobInfo
          title={job.title}
          company={job.company}
          matchScore={job.match_score ?? 0}
          salary={job.salary}
          location={job.location}
          jobType={job.job_type}
          foundAt={formatRelativeTime(job.found_at)}
          sourceUrl={job.source_url}
        />

        <MatchScore
          matchReason={job.match_reason}
          matchedSkills={job.matched_skills ?? []}
          missingSkills={job.missing_skills ?? []}
        />

        <JobDescription
          aboutRole={job.about_role}
          responsibilities={job.responsibilities ?? []}
          requirements={job.requirements ?? []}
          niceToHave={job.nice_to_have ?? []}
          benefits={job.benefits ?? []}
          aboutCompany={job.about_company}
        />

        <CompanyResearch
          jobId={job.id}
          company={job.company}
          initialDossier={job.company_research}
        />

        <JobActions company={job.company} externalApplyUrl={job.external_apply_url} />
      </main>
    </div>
  );
}
