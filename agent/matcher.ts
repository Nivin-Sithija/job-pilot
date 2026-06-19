import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { generateContentWithRetry } from "@/lib/gemini";
import { stripHtml, type ITProJob } from "@/lib/itpro";
import type { Profile } from "@/lib/profile";
import type { ScoredJob } from "@/agent/types";

const matchResultSchema = z.object({
  matchScore: z.number().min(0).max(100),
  matchReason: z.string(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
});

const SYSTEM_INSTRUCTION = `You are a job matching assistant. Score how well a candidate's profile fits a job posting.

Rules:
- matchScore is an integer 0-100 reflecting overall fit.
- matchReason is one concise paragraph explaining the score, grounded only in the provided profile and job description.
- matchedSkills are skills the candidate already has that the job asks for.
- missingSkills are skills the job asks for that the candidate's profile does not show.
- Never invent skills not present in either the profile or the job description.

Return ONLY valid JSON matching the provided schema.`;

export async function scoreJobAgainstProfile(
  job: ITProJob,
  profile: Profile,
): Promise<
  { success: true; data: Omit<ScoredJob, keyof ITProJob> } | { success: false; error: string }
> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const userPrompt = `JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${stripHtml(job.description)}

CANDIDATE PROFILE:
Current title: ${profile.currentTitle}
Experience level: ${profile.experienceLevel}
Years of experience: ${profile.yearsExperience}
Skills: ${profile.skills.join(", ")}
Industries: ${profile.industries.join(", ")}`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(matchResultSchema),
        temperature: 0.3,
        maxOutputTokens: 300,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    if (!response.text) {
      return { success: false, error: "Gemini returned no match result." };
    }

    const parsed = matchResultSchema.safeParse(JSON.parse(response.text));
    if (!parsed.success) {
      console.error("[agent/matcher]", parsed.error);
      return { success: false, error: "Could not parse match result." };
    }

    return { success: true, data: parsed.data };
  } catch (error) {
    console.error("[agent/matcher]", error);
    return { success: false, error: String(error) };
  }
}
