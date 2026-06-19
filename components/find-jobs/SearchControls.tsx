"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";

import { ActionResultDialog } from "@/components/shared/ActionResultDialog";

export function SearchControls() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("Frontend Engineer");
  const [location, setLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFindJobs(): Promise<void> {
    setIsSearching(true);
    setSuccessMessage(null);
    try {
      const response = await fetch("/api/agent/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, location }),
      });
      const result: {
        success: boolean;
        data?: { jobsFound: number; strongMatches: number };
        error?: string;
      } = await response.json();

      if (result.success && result.data) {
        setSuccessMessage(
          `Found ${result.data.jobsFound} jobs and saved ${result.data.strongMatches} strong matches.`,
        );
        router.refresh();
      } else {
        setError(result.error ?? "Job search failed. Please try again.");
      }
    } catch {
      setError("Job search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-end gap-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium uppercase text-text-secondary">Job Title</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium uppercase text-text-secondary">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Remote, New York..."
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <button
          type="button"
          disabled={isSearching || jobTitle.trim().length === 0}
          onClick={() => void handleFindJobs()}
          className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {isSearching ? "Searching..." : "Find Jobs"}
        </button>
      </div>

      {successMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-success-lightest px-3 py-2">
          <Sparkles className="h-4 w-4 text-success" />
          <p className="text-sm text-success-foreground">{successMessage}</p>
        </div>
      )}

      <ActionResultDialog
        open={error !== null}
        type="error"
        message={error ?? ""}
        onClose={() => setError(null)}
      />
    </div>
  );
}
