import { Check, MessageSquare, X } from "lucide-react";

type MatchScoreProps = {
  matchReason: string | null;
  matchedSkills: string[];
  missingSkills: string[];
};

export function MatchScore({ matchReason, matchedSkills, missingSkills }: MatchScoreProps) {
  return (
    <>
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
          <MessageSquare className="h-4 w-4 text-text-muted" />
          AI Match Reasoning
        </h2>
        <p className="text-sm text-text-secondary">
          {matchReason ?? "No match reasoning available for this job yet."}
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <h2 className="text-base font-semibold text-text-primary">Required Skills vs Your Profile</h2>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase text-text-secondary">You have</p>
          {matchedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 rounded-full bg-success-lightest px-2 py-0.5 text-xs font-medium text-success-foreground"
                >
                  <Check className="h-3 w-3" />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No matched skills found.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase text-text-secondary">Gap skills</p>
          {missingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
                >
                  <X className="h-3 w-3" />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No skill gaps found.</p>
          )}
        </div>
      </section>
    </>
  );
}
