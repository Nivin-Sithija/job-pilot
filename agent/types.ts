import type { ITProJob } from "@/lib/itpro";

export type ScoredJob = ITProJob & {
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
};
