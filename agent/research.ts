import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { generateContentWithRetry } from "@/lib/gemini";
import { createLocalStagehand } from "@/lib/stagehand";
import { deriveHomepageUrl } from "@/lib/itpro";
import { isPrivateOrLocalUrl } from "@/lib/url-safety";
import type { createInsforgeServer } from "@/lib/insforge-server";
import type { Profile } from "@/lib/profile";
import { logAgentError } from "@/agent/logger";
import { companyDossierSchema, type CompanyDossier } from "@/agent/types";

const homepageExtractSchema = z.object({
  oneLiner: z.string().describe("What the company does in one sentence"),
  productSummary: z.string().describe("What they build/sell and who it's for"),
  signals: z.array(z.string()).describe("Funding, notable customers, scale, mission, recent news"),
  pageLinks: z
    .array(
      z.object({
        label: z.string().describe("The link's visible text, exactly as shown on the page"),
        kind: z.enum(["about", "careers", "blog", "engineering", "product", "team", "other"]),
      }),
    )
    .describe("Internal links worth visiting"),
});

const subPageExtractSchema = z.object({
  keyPoints: z.array(z.string()),
  technologies: z.array(z.string()).describe("Specific languages, frameworks, tools, platforms"),
  valuesOrCulture: z.array(z.string()).describe("Stated values, working style, team norms"),
  notable: z.array(z.string()).describe("Customers, funding, scale, projects, awards"),
});

type SubPageData = z.infer<typeof subPageExtractSchema> & { url: string };

const SUB_PAGE_KIND_PRIORITY = ["about", "blog", "engineering", "product", "team", "careers", "other"];

const SYSTEM_INSTRUCTION = `You are a sharp career strategist preparing a candidate to apply for a specific role. You are given (a) research collected from the company's own website, (b) the job posting, and (c) the candidate's profile. Produce a concise, concrete briefing that gives this specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY valid JSON.`;

type ResearchJob = {
  id: string;
  company: string;
  website: string | null;
  aboutRole: string | null;
  matchedSkills: string[] | null;
  missingSkills: string[] | null;
};

async function gatherCompanyResearch(
  job: ResearchJob,
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>,
  runId: string,
  userId: string,
): Promise<{ homepage: z.infer<typeof homepageExtractSchema>; subPages: SubPageData[] } | null> {
  const homepageUrl = deriveHomepageUrl(job.website, job.company);

  if (await isPrivateOrLocalUrl(homepageUrl)) {
    await logAgentError(
      insforge,
      runId,
      userId,
      job.id,
      new Error(`Refused to navigate to private/local URL derived from job.website: ${homepageUrl}`),
    );
    return null;
  }

  const stagehand = createLocalStagehand();

  try {
    await stagehand.init();
    const page = stagehand.context.activePage();
    if (!page) throw new Error("Stagehand returned no active page after init().");

    await page.goto(homepageUrl);
    const homepage = await stagehand.extract(
      "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer, returning each link's exact visible text label (e.g. 'About Us', 'Careers') so it can be clicked later.",
      homepageExtractSchema,
    );

    if (!homepage.oneLiner?.trim() && !homepage.productSummary?.trim()) {
      return null;
    }

    // Extracted hrefs from a page snapshot aren't reliable (the model sometimes echoes
    // internal node references or visible labels instead of the real URL), so navigate by
    // clicking the visible link text via act() instead, then read the real landed URL.
    const preferredLinks = [...homepage.pageLinks]
      .sort((a, b) => SUB_PAGE_KIND_PRIORITY.indexOf(a.kind) - SUB_PAGE_KIND_PRIORITY.indexOf(b.kind))
      .slice(0, 3);

    const subPages: SubPageData[] = [];
    for (const link of preferredLinks) {
      await page.goto(homepageUrl);
      const clickResult = await stagehand.act(`Click the "${link.label}" link`);
      if (!clickResult.success) continue;

      const subPage = await stagehand.extract(
        "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
        subPageExtractSchema,
      );
      subPages.push({ ...subPage, url: page.url() });
    }

    return { homepage, subPages };
  } catch (error) {
    await logAgentError(insforge, runId, userId, job.id, error);
    return null;
  } finally {
    await stagehand.close();
  }
}

// No browser content and no Gemini result to draw from — last-resort dossier built purely
// from data already on hand (job + profile), so jobs.company_research is never left empty.
// Matches architecture.md's "always return a dossier — never return empty" invariant for the
// one path the Gemini-synthesis step itself can't recover from (e.g. sustained 429/503 past
// generateContentWithRetry's 3 attempts).
function buildFallbackDossier(job: ResearchJob, profile: Profile): CompanyDossier {
  const matchedSkills = job.matchedSkills ?? [];
  const missingSkills = job.missingSkills ?? [];

  return {
    companyOverview:
      job.aboutRole ?? `${job.company} — full company research could not be completed this time.`,
    techStack: matchedSkills,
    culture: [],
    whyThisRole:
      matchedSkills.length > 0
        ? `Your skills in ${matchedSkills.join(", ")} line up with what this role asks for.`
        : "Not enough information to assess fit beyond the job posting.",
    yourEdge: matchedSkills.map((skill) => `Direct experience with ${skill}`),
    gapsToAddress: missingSkills.map(
      (skill) => `${skill} isn't on your profile yet — be ready to speak to adjacent experience.`,
    ),
    smartQuestions: [
      `What does success look like in this role at ${job.company} in the first 90 days?`,
      "How does the team typically structure onboarding for someone with my background?",
    ],
    interviewPrep: [
      `Review ${profile.currentTitle ?? "your"} experience for stories that map to: ${job.aboutRole ?? "the role description"}.`,
    ],
    sources: ["Job posting and candidate profile only — company research could not be completed."],
  };
}

export async function researchCompany(
  job: ResearchJob,
  profile: Profile,
  runId: string,
  userId: string,
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>,
): Promise<{ success: true; dossier: CompanyDossier; degraded: boolean }> {
  const companyResearch = await gatherCompanyResearch(job, insforge, runId, userId);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const userPrompt = `COMPANY RESEARCH (from their website):
${companyResearch ? JSON.stringify(companyResearch) : "No usable research — synthesize from the job posting and candidate profile alone."}

JOB POSTING:
Company: ${job.company}
Description: ${job.aboutRole ?? "Not available"}
Matched skills (already computed): ${(job.matchedSkills ?? []).join(", ")}
Missing skills (already computed): ${(job.missingSkills ?? []).join(", ")}

CANDIDATE PROFILE:
Current title: ${profile.currentTitle}
Experience: ${profile.yearsExperience} years, level ${profile.experienceLevel}
Skills: ${profile.skills.join(", ")}
Work history: ${JSON.stringify(profile.workExperience)}`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(companyDossierSchema),
        temperature: 0.4,
        maxOutputTokens: 2000,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned no research result.");
    }

    const parsed = companyDossierSchema.safeParse(JSON.parse(response.text));
    if (!parsed.success) {
      throw new Error(`Could not parse research result: ${parsed.error.message}`);
    }

    return { success: true, dossier: parsed.data, degraded: false };
  } catch (error) {
    await logAgentError(insforge, runId, userId, job.id, error);
    return { success: true, dossier: buildFallbackDossier(job, profile), degraded: true };
  }
}
