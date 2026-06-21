import { z } from "zod";

import type { ITProJob } from "@/lib/itpro";

export type ScoredJob = ITProJob & {
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
};

export const companyDossierSchema = z.object({
  companyOverview: z.string(),
  techStack: z.array(z.string()),
  culture: z.array(z.string()),
  whyThisRole: z.string(),
  yourEdge: z.array(z.string()),
  gapsToAddress: z.array(z.string()),
  smartQuestions: z.array(z.string()),
  interviewPrep: z.array(z.string()),
  sources: z.array(z.string()),
});

export type CompanyDossier = z.infer<typeof companyDossierSchema>;
