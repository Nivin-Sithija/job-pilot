"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { ActionResultDialog } from "@/components/shared/ActionResultDialog";
import type { CompanyDossier } from "@/agent/types";

type CompanyResearchProps = {
  jobId: string;
  company: string;
  initialDossier: CompanyDossier | null;
};

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm text-text-secondary">
          <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-text-muted" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function CompanyResearch({ jobId, company, initialDossier }: CompanyResearchProps) {
  const [dossier, setDossier] = useState<CompanyDossier | null>(initialDossier);
  const [isResearching, setIsResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResearch(): Promise<void> {
    setIsResearching(true);
    try {
      const response = await fetch("/api/agent/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const result: { success: boolean; data?: { dossier: CompanyDossier }; error?: string } =
        await response.json();

      if (result.success && result.data) {
        setDossier(result.data.dossier);
      } else {
        setError(result.error ?? "Company research failed. Please try again.");
      }
    } catch {
      setError("Company research failed. Please try again.");
    } finally {
      setIsResearching(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
          <Search className="h-4 w-4 text-text-muted" />
          Company Research
        </h2>
        <button
          type="button"
          disabled={isResearching}
          onClick={() => void handleResearch()}
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {isResearching ? "Researching..." : dossier ? "Research Again" : "Research Company"}
        </button>
      </div>

      {dossier ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase text-text-secondary">Company Overview</p>
            <p className="text-sm text-text-secondary">{dossier.companyOverview}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase text-text-secondary">Tech Stack</p>
            <TagList items={dossier.techStack} />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase text-text-secondary">Culture</p>
            <BulletList items={dossier.culture} />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase text-text-secondary">Why This Role</p>
            <p className="text-sm text-text-secondary">{dossier.whyThisRole}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase text-text-secondary">Your Edge</p>
            <BulletList items={dossier.yourEdge} />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase text-text-secondary">Gaps to Address</p>
            <BulletList items={dossier.gapsToAddress} />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase text-text-secondary">Smart Questions</p>
            <BulletList items={dossier.smartQuestions} />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase text-text-secondary">Interview Prep</p>
            <BulletList items={dossier.interviewPrep} />
          </div>

          {dossier.sources.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium uppercase text-text-secondary">Sources</p>
              {dossier.sources.map((source) => (
                <p key={source} className="text-xs text-text-muted">
                  {source}
                </p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Search className="h-6 w-6 text-text-muted" />
          <p className="text-sm font-medium text-text-primary">No research yet</p>
          <p className="max-w-sm text-sm text-text-muted">
            Click &quot;Research Company&quot; to let the AI browse {company}&apos;s public pages and build a
            dossier.
          </p>
        </div>
      )}

      <ActionResultDialog
        open={error !== null}
        type="error"
        message={error ?? ""}
        onClose={() => setError(null)}
      />
    </section>
  );
}
