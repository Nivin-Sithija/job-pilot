import { GoogleGenAI } from "@google/genai";
import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import { z } from "zod";

// pdfjs-dist (used internally by pdf-parse) needs an explicit worker source in Next.js's
// server bundle, or text extraction fails with "Setting up fake worker failed" at runtime
PDFParse.setWorker(getPath());

import type { createInsforgeServer } from "@/lib/insforge-server";
import { generateContentWithRetry } from "@/lib/gemini";
import { profileSchema, type Profile } from "@/lib/profile";

const MIN_EXTRACTED_TEXT_LENGTH = 50;

export async function loadCurrentResumeBuffer(
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>,
  userId: string,
): Promise<{ success: true; buffer: Buffer } | { success: false; status: number; error: string }> {
  const { data: profileRow } = await insforge.database
    .from("profiles")
    .select("resume_pdf_key")
    .eq("id", userId)
    .maybeSingle();

  // insforge.database.from() returns an untyped row — cast is safe since we selected exactly this column
  const resumeKey = (profileRow as { resume_pdf_key: string | null } | null)?.resume_pdf_key;
  if (!resumeKey) {
    return { success: false, status: 404, error: "No resume uploaded yet." };
  }

  const { data: blob, error } = await insforge.storage.from("resumes").download(resumeKey);
  if (error || !blob) {
    console.error("[lib/resume]", error);
    return { success: false, status: 500, error: "Failed to load your resume." };
  }

  return { success: true, buffer: Buffer.from(await blob.arrayBuffer()) };
}

export const extractedProfileSchema = profileSchema.pick({
  fullName: true,
  phone: true,
  location: true,
  linkedinUrl: true,
  portfolioUrl: true,
  currentTitle: true,
  experienceLevel: true,
  yearsExperience: true,
  skills: true,
  industries: true,
  workExperience: true,
  education: true,
});
export type ExtractedProfileFields = z.infer<typeof extractedProfileSchema>;

export async function extractResumeText(
  buffer: Buffer,
): Promise<{ success: true; text: string } | { success: false; error: string }> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    if (result.text.trim().length < MIN_EXTRACTED_TEXT_LENGTH) {
      return {
        success: false,
        error: "Could not extract text from this PDF. Please try a different file.",
      };
    }

    return { success: true, text: result.text };
  } catch (error) {
    console.error("[lib/resume]", error);
    return {
      success: false,
      error: "Could not extract text from this PDF. Please try a different file.",
    };
  }
}

const SYSTEM_INSTRUCTION = `You are a resume parser. Read the resume text and extract only what it actually states.

Rules:
- Never invent values. If the resume does not state a field, return an empty string ("") or empty array.
- experienceLevel must be one of: "junior", "mid", "senior", "lead", or "" if it cannot be inferred from job titles/years.
- yearsExperience is total years of professional experience as a numeric string (e.g. "5"), or "" if unclear.
- workExperience is at most the 3 most recent roles, most recent first. Dates use "YYYY-MM" format, or "" if unknown. currentlyWorking is true only for a role explicitly marked as present/current.
- education reflects the highest degree only.
- skills and industries are short tags, not sentences.

Return ONLY valid JSON matching the provided schema.`;

export async function extractProfileFromResumeText(
  text: string,
): Promise<
  { success: true; data: ExtractedProfileFields } | { success: false; error: string }
> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: `RESUME TEXT:\n${text}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(extractedProfileSchema),
        temperature: 0.3,
        maxOutputTokens: 800,
        // gemini-2.5-flash spends maxOutputTokens on internal "thinking" before the
        // final answer by default, which truncated the JSON output mid-string in testing.
        // This is deterministic extraction, not reasoning, so thinking adds no value here.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    if (!response.text) {
      return {
        success: false,
        error: "Could not extract profile information from this resume. Please fill in the form manually.",
      };
    }

    const parsed = extractedProfileSchema.safeParse(JSON.parse(response.text));
    if (!parsed.success) {
      console.error("[lib/resume]", parsed.error);
      return {
        success: false,
        error: "Could not extract profile information from this resume. Please fill in the form manually.",
      };
    }

    return { success: true, data: parsed.data };
  } catch (error) {
    console.error("[lib/resume]", error);
    return {
      success: false,
      error: "Could not extract profile information from this resume. Please fill in the form manually.",
    };
  }
}

export const generatedResumeContentSchema = z.object({
  summary: z.string(),
  workExperience: z.array(
    z.object({
      company: z.string(),
      jobTitle: z.string(),
      dateRange: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
});
export type GeneratedResumeContent = z.infer<typeof generatedResumeContentSchema>;

const GENERATE_SYSTEM_INSTRUCTION = `You are a professional resume writer. Given a candidate's profile, write a polished professional summary and rewrite their work experience as clean, concrete resume bullet points.

Rules:
- Ground every claim in the provided profile. Never invent companies, dates, titles, or skills not present.
- summary is 2-3 sentences, written in a confident professional tone, highlighting current title/level, years of experience, and top skills/industries.
- workExperience has exactly one entry per role provided, in the same order, using the same company/jobTitle/dateRange (dateRange is "startDate - endDate", or "startDate - Present" if currentlyWorking).
- bullets rewrite the role's responsibilities into 2-4 concise, action-oriented resume bullet points. If responsibilities is empty, return an empty bullets array rather than inventing content.
- If no roles are provided, return an empty workExperience array.

Return ONLY valid JSON matching the provided schema.`;

export async function generateResumeContent(
  profile: Profile,
): Promise<
  { success: true; data: GeneratedResumeContent } | { success: false; error: string }
> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const userPrompt = `CANDIDATE PROFILE:
Current title: ${profile.currentTitle}
Experience level: ${profile.experienceLevel}
Years of experience: ${profile.yearsExperience}
Skills: ${profile.skills.join(", ")}
Industries: ${profile.industries.join(", ")}
Work experience: ${JSON.stringify(profile.workExperience)}`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: GENERATE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(generatedResumeContentSchema),
        temperature: 0.7,
        maxOutputTokens: 1000,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    if (!response.text) {
      return { success: false, error: "Could not generate resume content. Please try again." };
    }

    const parsed = generatedResumeContentSchema.safeParse(JSON.parse(response.text));
    if (!parsed.success) {
      console.error("[lib/resume]", parsed.error);
      return { success: false, error: "Could not generate resume content. Please try again." };
    }

    return { success: true, data: parsed.data };
  } catch (error) {
    console.error("[lib/resume]", error);
    return { success: false, error: "Could not generate resume content. Please try again." };
  }
}
