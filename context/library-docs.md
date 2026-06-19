# Library Docs

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to JobPilot.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check AGENTS.md** at the project root — it lists every skill installed for this project and how to use them. Skills contain up-to-date API documentation, usage patterns, and best practices specific to this codebase.

2. **Check if an MCP server is configured** for that library. Some tools have MCP servers that give the AI agent direct access to documentation, logs, and debugging tools. If an MCP server is available — use it before falling back to general knowledge.

3. **Read this file** for project-specific patterns that override general library knowledge.

The order of authority is:

```
MCP server (real-time docs) → Skills via AGENTS.md → This file (project rules) → General training knowledge
```

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated.

---

## InsForge

**Check first:** Check AGENTS.md for an installed InsForge skill. If an InsForge MCP server is configured — use it. The skill/MCP will have the latest API patterns.

The real package is `@insforge/sdk` (`@insforge/ssr` does not exist — confirmed 404 on npm). Next.js-specific helpers ship under its `/ssr` and `/ssr/middleware` subpath exports, verified directly against the published type definitions.

### Client vs Server vs Auth Actions

Three contexts — never mix them:

```typescript
// lib/insforge-server.ts — Server Components, Route Handlers, Server Actions, agent code
// Full client (auth + database), scoped to the user via the session cookie. RLS applies.
import { createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";

export const createInsforgeServer = async () => {
  const cookieStore = await cookies();
  return createServerClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    cookies: cookieStore,
  });
};
```

```typescript
// lib/insforge-client.ts — Client Components only
// Read-only auth surface: getCurrentUser, getProfile, getPublicAuthConfig.
// No signIn/signOut here — those mutate httpOnly cookies and must happen server-side.
import { createBrowserClient } from "@insforge/sdk/ssr";

export const insforge = createBrowserClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});
```

```typescript
// actions/auth.ts — Server Actions, the only place auth mutations happen
import { createAuthActions } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";

const auth = createAuthActions({ cookies: await cookies() });
await auth.signInWithOAuth("google", { redirectTo: "/api/auth/callback" });
await auth.signOut();
```

```typescript
// app/api/auth/callback/route.ts — Route Handler, exchanges the OAuth code
import { createAuthActions } from "@insforge/sdk/ssr";

const auth = createAuthActions({
  requestCookies: request.cookies,
  responseCookies: response.cookies,
});
await auth.exchangeOAuthCode(code, codeVerifier);
```

```typescript
// proxy.ts (project root) — optimistic session check, NOT full authorization
import { updateSession } from "@insforge/sdk/ssr/middleware";

await updateSession({ requestCookies: request.cookies, responseCookies: response.cookies });
```

**Rules:**

- Server client (`createServerClient`) — Server Components, API routes, Server Actions, agent functions
- Browser client (`createBrowserClient`) — Client Components, read-only auth state only
- Auth Actions (`createAuthActions`) — the only place sign-in/sign-out/OAuth-exchange happen, because they write the `insforge_access_token`/`insforge_refresh_token` httpOnly cookies
- `proxy.ts` uses `@insforge/sdk/ssr/middleware` (not the full `/ssr` import) — lighter bundle, cookie checks only
- Never read/write the session cookies manually — the SDK's SSR helpers own them
- Never use the browser client for mutations or in server context
- Never use the server client in browser context

---

### Auth

```typescript
// Get current user in server context
const insforge = await createInsforgeServer();
const { data, error } = await insforge.auth.getCurrentUser();
if (!data.user) redirect("/login");
```

---

### DB Queries

Verified against the installed `@insforge/sdk` type definitions — the client does **not** expose `.from()` directly. `InsForgeClient` has `auth`/`database`/`storage`/`ai`/`functions`/`realtime`/`emails`/`payments` as named properties; `.from()` lives on `database`. Always call `insforge.database.from(...)`, never `insforge.from(...)`.

```typescript
// Read
const { data, error } = await insforge.database
  .from("jobs")
  .select("*")
  .eq("user_id", user.id)
  .order("found_at", { ascending: false });

// Insert
const { data, error } = await insforge.database
  .from("jobs")
  .insert({ user_id: user.id, title, company, match_score })
  .select()
  .single();

// Update
const { error } = await insforge.database
  .from("jobs")
  .update({ company_research: dossier })
  .eq("id", jobId)
  .eq("user_id", user.id); // always scope to user

// Upsert (insert-or-update by conflict column, e.g. profiles.id)
const { error } = await insforge.database
  .from("profiles")
  .upsert({ id: user.id, full_name: fullName }, { onConflict: "id" });

// maybeSingle() — like .single() but returns null instead of an error when no row exists
const { data } = await insforge.database
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();
```

**Rules:**

- Always scope queries to `user_id` — never query without user filter
- Always handle the `error` return — never assume success
- Use `.single()` when expecting exactly one row

---

### Storage

Verified against the real published SDK docs (`fetch-docs storage-sdk`) — the API differs from what was previously documented here:

- `.upload(path, file)` takes only a path and a `File`/`Blob` — there is no `contentType` or `upsert` option.
- It returns `{ bucket, key, size, mimeType, uploadedAt, url }` directly — the `url` is already on the response, there is no separate `.getPublicUrl()` call.
- **Re-uploading to an existing key does not overwrite it** — InsForge auto-renames on collision and returns the new `key`/`url`. A fixed path like `{user_id}/resume.pdf` will NOT reliably hold "the current resume" across re-uploads.
- The `resumes` bucket was created with `isPublic: false` (architecture.md: "authenticated access only") — for private buckets, reads also require an authenticated request; the returned `url` is not a plain public link.

```typescript
// Upload file — always save BOTH the returned url and key, the key is needed for download()/remove()
const { data, error } = await insforge.storage
  .from("resumes")
  .upload(`${userId}/resume.pdf`, fileBlob);

// data: { bucket, key, size, mimeType, uploadedAt, url }
```

**Storage paths:**

- Base resume: `resumes/{user_id}/resume.pdf` — naming convention only, not an overwrite guarantee.
- **One resume per user is enforced by `remove()`, not by path.** Before uploading a new resume, call `.remove(previousKey)` using the `resume_pdf_key` stored on `profiles` (column added for this purpose), then upload and save the new `url`/`key`. If there's no previous key (first upload), skip the remove.

**Rules:**

- Always save both `data.url` and `data.key` to the DB — `key` is required for `download()`/`remove()`, `url` alone is not enough to manage the file later
- Never write files to disk — always upload buffer/blob directly to storage
- Treat the bucket as private: don't assume `resume_pdf_url` is fetchable without auth

**Serving a private file back to the browser (view/download):**

Since the bucket is private, `resume_pdf_url` can't be used as a direct `<a href>` — the browser has no auth context for it. Instead, route the request through an authenticated Route Handler that downloads the blob server-side and streams it back with the right `Content-Disposition`:

```typescript
// app/api/resume/view/route.ts — "inline" opens in a new tab via the browser's PDF viewer
// app/api/resume/download/route.ts — "attachment" forces a save-to-disk prompt
const { data: blob, error } = await insforge.storage.from("resumes").download(resumeKey);
const buffer = Buffer.from(await blob.arrayBuffer());

return new NextResponse(new Uint8Array(buffer), {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'inline; filename="resume.pdf"', // or 'attachment; ...'
  },
});
```

A plain `<a href="/api/resume/view" target="_blank">` (or no `target` for download) works without any client-side `fetch` — same-origin navigation sends the session cookie automatically, so the Route Handler's own auth check (`insforge.auth.getCurrentUser()`) is all that's needed.

---

## ITPro.lk API

**Check first:** Check AGENTS.md for an installed ITPro.lk skill. If none exists — use this file. There is no official SDK; it's a plain public REST endpoint, no signup or API key needed for reads.

Confirmed by direct testing (not just docs): `GET https://itpro.lk/api/v1/jobs` returns live Sri Lankan tech job postings with no auth header. `limit` is the only query param that actually does anything (tested up to 200). `page`, `q`, `keyword`, `search`, and `title` are all silently ignored — the endpoint always returns the same "recent jobs" feed regardless of what's passed. There is no `/locations` or `/categories` lookup endpoint, so the numeric `location`/`category_id`/`type_id` fields on each job cannot be resolved to readable labels.

### Job Search

```typescript
// lib/itpro.ts
export async function fetchRecentJobs(limit = 100): Promise<ITProJob[]> {
  const response = await fetch(`https://itpro.lk/api/v1/jobs?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`ITPro.lk API error: ${response.status}`);
  }

  return response.json();
}

// Filtering happens here, not on the API — it has no server-side search
export function filterJobs(
  jobs: ITProJob[],
  jobTitle: string,
  location: string,
): ITProJob[] {
  const titleNeedle = jobTitle.toLowerCase();
  return jobs.filter((job) => {
    const haystack = `${job.title} ${job.description}`.toLowerCase();
    if (!haystack.includes(titleNeedle)) return false;
    if (location && !haystack.includes(location.toLowerCase())) return false;
    return true;
  });
}
```

### Response Shape

Each ITPro.lk job result contains:

```typescript
type ITProJob = {
  id: string;
  title: string;
  description: string; // full HTML description — strip tags before storing/scoring
  summary: string;
  type_id: string; // opaque numeric id, no public lookup
  category_id: string; // opaque numeric id, no public lookup
  location: string | null; // opaque numeric id, no public lookup
  company: string;
  website: string | null;
  views_count: string;
  created_on: string; // ISO date string
};
```

### Saving Jobs to DB

```typescript
// Map ITPro.lk result to jobs table
const jobRecord = {
  user_id: userId,
  run_id: runId,
  source: "search", // always 'search' for ITPro.lk jobs
  source_url: `https://itpro.lk/jobs/${job.id}`,
  external_apply_url: `https://itpro.lk/jobs/${job.id}`,
  title: job.title,
  company: job.company,
  location: null, // numeric id only — no readable label to store
  salary: null, // ITPro.lk does not return salary data
  job_type: "fulltime", // not reliably derivable from type_id without a lookup
  about_role: stripHtml(job.description),
  match_score: scoredJob.matchScore,
  match_reason: scoredJob.matchReason,
  matched_skills: scoredJob.matchedSkills,
  missing_skills: scoredJob.missingSkills,
  found_at: new Date().toISOString(),
};
```

**Rules:**

- Never trust query params to filter server-side — always fetch a batch (`limit=100` or higher) and filter with `filterJobs()` client-side
- `source` is always `'search'` for ITPro.lk jobs — never any other value
- `description` is full HTML — always strip tags before passing to Gemini 2.5 Flash or storing in `about_role`
- Never attempt to resolve `location`/`category_id`/`type_id` to a label — there is no public endpoint for it; store `null` or leave for a future manual mapping
- No API key, app_id, or app_key required — never add auth headers to this request

---

## Browserbase

**Check first:** Check AGENTS.md for an installed Browserbase skill. If a Browserbase MCP server is configured — use it. The skill/MCP will have the latest session management and API patterns.

### Session Creation — Company Research

```typescript
import Browserbase from "@browserbasehq/sdk";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

// Single session for company research — sequential page visits
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  timeout: 120, // 2 minute session — visits 3-4 pages max
});
```

**Important — Browserbase runs independently from your Next.js server:**
Browserbase sessions run on Browserbase's cloud infrastructure, not inside your Next.js API route. The API route triggers the Browserbase session and returns a response while the session continues running independently on Browserbase's platform. Do not add `maxDuration` or any timeout configuration to Next.js API routes to accommodate Browserbase session length.

**Rules:**

- Always use single sessions — never parallel sessions (free plan limit)
- Session timeout is 120 seconds — sufficient for 3-4 page visits
- Always end sessions cleanly — call stagehand.close() when done
- Project ID always from `process.env.BROWSERBASE_PROJECT_ID` — never hardcode
- Browserbase client lives in `lib/browserbase.ts` — always import from there

---

## Stagehand

**Check first:** Check AGENTS.md for an installed Stagehand skill. If a Stagehand MCP server is configured — use it. The skill/MCP will have the latest act() and extract() patterns.

### Initialisation

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY!,
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  browserbaseSessionID: session.id,
  model: { modelName: "google/gemini-2.5-flash", apiKey: process.env.GEMINI_API_KEY! },
  disablePino: true,
});

await stagehand.init();
const page = stagehand.context.activePage()!;
```

### extract()

```typescript
import { z } from "zod";

const result = await stagehand.extract({
  instruction:
    "Extract the company overview, main product description, and any technology mentions from this page.",
  schema: z.object({
    companyOverview: z.string().optional(),
    mainProduct: z.string().optional(),
    techMentions: z.array(z.string()).optional(),
    navLinks: z
      .array(
        z.object({
          label: z.string(),
          url: z.string(),
        }),
      )
      .optional(),
  }),
});
```

### act()

```typescript
// Always wrap in try/catch
try {
  await stagehand.act({
    action: "Click the About link in the navigation",
  });
} catch (error) {
  await logAgentError(jobId, null, error);
}
```

## Company Research Section

Replace the existing Stagehand "Company Research Pattern" section in library-docs.md with this:

---

### Company Research Pattern

Three-step process: homepage extraction → sub-page extraction → Gemini 2.5 Flash synthesis.
Job description and user profile come from DB — never re-fetch what you already have.
Browser's only job is the company website.

```typescript
// Step 1 — Homepage extraction
const homepageData = await stagehand.extract({
  instruction:
    "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer.",
  schema: z.object({
    oneLiner: z.string().describe("What the company does in one sentence"),
    productSummary: z
      .string()
      .describe("What they build/sell and who it's for"),
    signals: z
      .array(z.string())
      .describe("Funding, notable customers, scale, mission, recent news"),
    pageLinks: z
      .array(
        z.object({
          url: z.string(),
          kind: z.enum([
            "about",
            "careers",
            "blog",
            "engineering",
            "product",
            "team",
            "other",
          ]),
        }),
      )
      .describe("Internal links worth visiting"),
  }),
});

// If oneLiner and productSummary are empty — wrong site or parked domain
// Skip to synthesis with job description and profile only
if (!homepageData.oneLiner && !homepageData.productSummary) {
  await stagehand.close();
  // proceed to synthesis with empty companyResearch
}

// Step 2 — Sub-page extraction (max 3, prefer about/blog/engineering/product over careers)
const subPageData = await stagehand.extract({
  instruction:
    "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
  schema: z.object({
    keyPoints: z.array(z.string()),
    technologies: z
      .array(z.string())
      .describe("Specific languages, frameworks, tools, platforms"),
    valuesOrCulture: z
      .array(z.string())
      .describe("Stated values, working style, team norms"),
    notable: z
      .array(z.string())
      .describe("Customers, funding, scale, projects, awards"),
  }),
});

// Step 3 — Gemini 2.5 Flash synthesis (after browser closes)
// Feed three data sources: company research + job from DB + profile from DB
const systemPrompt = `You are a sharp career strategist preparing a candidate to apply for a specific role. You are given (a) research collected from the company's own website, (b) the job posting, and (c) the candidate's profile. Produce a concise, concrete briefing that gives this specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY valid JSON matching this shape:
{
  "companyOverview": string,
  "techStack": string[],
  "culture": string[],
  "whyThisRole": string,
  "yourEdge": string[],
  "gapsToAddress": string[],
  "smartQuestions": string[],
  "interviewPrep": string[],
  "sources": string[]
}`;

const userPrompt = `COMPANY RESEARCH (from their website):
${JSON.stringify(companyResearch)}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Matched skills (already computed): ${job.matched_skills.join(", ")}
Missing skills (already computed): ${job.missing_skills.join(", ")}

CANDIDATE PROFILE:
Current title: ${profile.current_title}
Experience: ${profile.years_experience} years, level ${profile.experience_level}
Skills: ${profile.skills.join(", ")}
Work history: ${JSON.stringify(profile.work_experience)}`;

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  config: {
    systemInstruction: systemPrompt,
    responseMimeType: "application/json",
    temperature: 0.4,
  },
  contents: userPrompt,
});
```

**Dossier fields:**

| Field           | Type     | Purpose                                             |
| --------------- | -------- | --------------------------------------------------- |
| companyOverview | string   | What the company does                               |
| techStack       | string[] | Technologies they use                               |
| culture         | string[] | Values and working style                            |
| whyThisRole     | string   | Why this role exists                                |
| yourEdge        | string[] | Specific links between THIS candidate and this role |
| gapsToAddress   | string[] | Missing skills reframed as strategy                 |
| smartQuestions  | string[] | Questions that show real research                   |
| interviewPrep   | string[] | Topics to prepare for this role                     |
| sources         | string[] | Pages the company info came from                    |

**Rules:**

- Always use `extract()` with a Zod schema — never parse raw HTML or use regex
- Always wrap every `act()` and `extract()` in try/catch
- Always call `await stagehand.close()` when done — ends the Browserbase session
- Model is always `gemini-2.5-flash` — never use other models
- Temperature is `0.4` for synthesis — grounded but flexible enough to make real connections
- Max 3 sub-pages — never exceed this on free plan
- Always close session in finally block — never leave sessions open even if research fails
- Job description and profile always come from DB — never re-fetch via browser
- If browser research returns empty — still run synthesis with job + profile only
- yourEdge, gapsToAddress, and smartQuestions are the most valuable fields — never skip them

## Google Gemini 2.5 Flash

**Check first:** Check AGENTS.md for an installed Gemini skill. The skill will have the latest API patterns and model capabilities.

### Structured JSON Response

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  config: {
    systemInstruction: "You are a job matching assistant. Return only valid JSON.",
    responseMimeType: "application/json",
    temperature: 0.3,
  },
  contents: `Your prompt here`,
});

const result = JSON.parse(response.text!);
```

### Schema-Enforced Structured Output (Preferred Over Prompt-Described JSON)

**Verified directly against the `GenerateContentConfig` type in the installed `@google/genai` SDK source.** Since this project uses zod v4, which has a native `z.toJSONSchema()`, prefer passing that into `responseJsonSchema` over just describing the JSON shape in the prompt — it actually constrains the model's output instead of just hoping it complies:

```typescript
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const mySchema = z.object({ fullName: z.string(), skills: z.array(z.string()) });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Your prompt here",
  config: {
    systemInstruction: "You are a job matching assistant. Return only valid JSON.",
    responseMimeType: "application/json",
    responseJsonSchema: z.toJSONSchema(mySchema),
    temperature: 0.3,
  },
});

// responseJsonSchema is a strong hint, not a hard guarantee — still validate after parsing
const parsed = mySchema.safeParse(JSON.parse(response.text!));
```

**Rules:**

- `config.responseSchema` (Gemini's own OpenAPI-3.0-subset `Schema` type) and `config.responseJsonSchema` (standard JSON Schema) are two distinct fields on `GenerateContentConfig` — they are mutually exclusive, and `responseJsonSchema` is what `z.toJSONSchema()` output should go into
- `responseMimeType: "application/json"` must still be set alongside `responseJsonSchema`
- There is no `responseFormat` field on this SDK's config — that shape belongs to a different provider's API; do not use it here
- Still `safeParse()` the result against the same zod schema after `JSON.parse()` — schema-constrained output reduces but does not eliminate malformed responses

**Temperature settings:**

- `0.3` — matching, scoring, extraction, research synthesis — deterministic results
- `0.7` — resume generation — natural variation

**Max tokens:**

- Job matching + scoring: `300`
- Company research synthesis: `800`
- Resume generation: `1000`
- Profile extraction from resume: `800`

### Disable Thinking for Structured Extraction (Required — Confirmed by Reproducing the Failure)

`gemini-2.5-flash` is a "thinking" model — by default it spends part of `maxOutputTokens` on internal reasoning before writing the final answer. For deterministic structured-extraction tasks (matching, profile extraction, research synthesis) this adds no value and was confirmed locally to truncate the JSON output mid-string (`SyntaxError: Unterminated string in JSON`) at `maxOutputTokens: 800`. Fix: set `thinkingBudget: 0` in `config.thinkingConfig`:

```typescript
config: {
  responseMimeType: "application/json",
  responseJsonSchema: z.toJSONSchema(mySchema),
  maxOutputTokens: 800,
  thinkingConfig: { thinkingBudget: 0 }, // 0 = disabled, -1 = automatic — model-dependent default otherwise
}
```

**Rules:**

- Model string is always `'gemini-2.5-flash'` — never use other model names
- Always set `thinkingConfig: { thinkingBudget: 0 }` for matching/extraction/synthesis tasks — none of this project's Gemini use cases need reasoning, and leaving thinking enabled risks truncated JSON under the existing token budgets
- Always use `responseMimeType: 'application/json'` in `config` for structured data
- Always parse `response.text` as string — even with JSON mime type it returns a string
- Always validate parsed JSON before using — wrap in try/catch
- Match threshold is always `MATCH_THRESHOLD` from `lib/utils.ts` — never hardcode 70
- Company research synthesis must always return a complete dossier — never return empty even if browser research failed

---

## PostHog

**Check first:** Check AGENTS.md for an installed PostHog skill. If a PostHog MCP server is configured — use it. The skill/MCP will have the latest client and server patterns.

### Client Setup (Browser)

This Next.js version (16) auto-loads `instrumentation-client.ts` at the project root — no manual init call or import from `app/layout.tsx` needed. There is no `lib/posthog-client.ts` in this project; that's the older pre-15.3 pattern superseded by `instrumentation-client.ts`.

```typescript
// instrumentation-client.ts (project root)
import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest", // reverse-proxied — see next.config.ts rewrites, avoids ad-blocker interference
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30", // includes pageview/autocapture/exception capture
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
});

// Capture event client-side, in the event handler — never in useEffect
posthog.capture("job_found", {
  userId,
  source: "search",
  matchScore: score,
});
```

The `/ingest/*` rewrite in `next.config.ts` proxies to `us.i.posthog.com` (and `/ingest/static/*` + `/ingest/array/*` to `us-assets.i.posthog.com`) so analytics calls aren't blocked by ad blockers.

### Server Setup

```typescript
// lib/posthog-server.ts
import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

// Module-level singleton — reused across requests/invocations, never shut down.
// flushAt: 1 / flushInterval: 0 means every capture() is sent immediately with
// no batching, so there's nothing waiting in a buffer for shutdown() to flush.
export function getPostHogClient() {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

getPostHogClient().capture({
  distinctId: userId,
  event: "company_researched",
  properties: { userId, jobId, company },
});
```

**Rules:**

- Use the `getPostHogClient()` singleton from `lib/posthog-server.ts` — never instantiate `PostHog` directly elsewhere
- `flushAt: 1` and `flushInterval: 0` always set on the server client
- Event names must match exactly the list in `code-standards.md`
- Always include `userId` as a property on every server-side event (except where the distinct ID itself is the user ID)
- Call `posthog.identify(userId)` after login on client side (see `components/PostHogIdentify.tsx` — fires on every authenticated visit to `/dashboard`, which also covers returning visitors)
- Call `posthog.reset()` on logout on client side (see `components/dashboard/SignOutButton.tsx`)

---

## @react-pdf/renderer

**Check first:** Check AGENTS.md for an installed react-pdf skill. PDF generation APIs can differ from general training knowledge.

### Resume PDF Generation

The `<Document>`/`<Page>` JSX component lives in its own `.tsx` file (e.g. `lib/resume-pdf.tsx`), since Route Handlers stay `.ts` per Next.js convention — `createElement()` bridges the gap instead of inline JSX:

```typescript
// lib/resume-pdf.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  section: { marginBottom: 10 },
  heading: { fontSize: 14, fontWeight: 'bold' },
  text: { fontSize: 10 },
})

// profile.email does not exist — email is fetched separately via auth.getCurrentUser()
// and passed in explicitly, never stored on the Profile type
export function ResumePDF({ profile, email }: { profile: Profile; email: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.heading}>{profile.fullName}</Text>
          <Text style={styles.text}>{email}</Text>
        </View>
      </Page>
    </Document>
  )
}
```

```typescript
// app/api/resume/generate/route.ts — plain .ts, no JSX
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'

// renderToBuffer's type is stricter than its runtime contract — it wants
// React.ReactElement<DocumentProps> literally, which any component wrapping
// <Document> fails structurally. The cast is required and safe.
const buffer = await renderToBuffer(
  createElement(ResumePDF, { profile, email }) as ReactElement<DocumentProps>,
)

// Upload directly to InsForge Storage — no contentType/upsert options exist (see Storage
// section above). Wrap the buffer in a Blob via a fresh Uint8Array — passing a Node Buffer
// directly into `new Blob([buffer])` fails TypeScript's BlobPart check.
const { data: uploaded, error } = await insforge.storage
  .from('resumes')
  .upload(`${userId}/resume.pdf`, new Blob([new Uint8Array(buffer)], { type: 'application/pdf' }))
// Always remove() the previous resume_pdf_key first if one exists — see Storage section.
```

**Supported CSS properties:**
Only use these — others are silently ignored:
`padding, margin, fontSize, color, fontFamily, flexDirection, alignItems, justifyContent, borderRadius, width, height, fontWeight, textAlign, lineHeight`

**Rules:**

- Server-side only — never import in client components
- Always use `renderToBuffer` — not `renderToStream` or `PDFDownloadLink`
- PDF generation only in `app/api/resume/` routes
- Generated buffer uploaded directly to InsForge Storage — never written to disk
- Always save public URL and key to DB after upload — `key` is required to `remove()` it before the next regeneration
- The `<Document>`/`<Page>` component lives in its own `.tsx` file (e.g. `lib/resume-pdf.tsx`) — the consuming Route Handler stays `.ts` and builds the element with `createElement()`, not inline JSX
- Cast the element passed to `renderToBuffer` as `ReactElement<DocumentProps>` — its declared type is stricter than what actually works at runtime
- `v4.5.1` installs cleanly against React 19 — no peer-dependency conflict encountered

---

## pdf-parse

**Check first:** Check AGENTS.md for an installed pdf-parse skill.

**Verified against the installed package (`pdf-parse@2.4.5`) — this is a v2 rewrite with a breaking API change from the old `pdf(buffer)` default-export function shown in older docs/training data.** v2 is class-based:

### Extract Text from a PDF Buffer

```typescript
import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

// Required once, before any PDFParse usage, in Next.js — see "Next.js Worker Bundling" below
PDFParse.setWorker(getPath());

// buffer is a Node Buffer — e.g. from a downloaded InsForge Storage Blob via Buffer.from(await blob.arrayBuffer())
const parser = new PDFParse({ data: buffer });
const result = await parser.getText();
await parser.destroy(); // always release the parser when done

const extractedText = result.text; // concatenated text across all pages
```

### Next.js Worker Bundling (Required — Confirmed by Reproducing the Failure)

Without both of these, `getText()` throws `Setting up fake worker failed: "Cannot find module '.../pdf.worker.mjs'"` at runtime under Next.js/Turbopack — confirmed by hitting this exact error locally, then fixing it with pdf-parse's own troubleshooting docs:

1. `next.config.ts` must mark the package external so Next.js doesn't try to bundle its worker file itself:
   ```typescript
   const nextConfig: NextConfig = {
     serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
   };
   ```
2. Call `PDFParse.setWorker(getPath())` (from `pdf-parse/worker`) once before constructing any `PDFParse` instance — module-level in the file that uses it is fine.

**Rules:**

- Server-side only — never import in client components
- Always `new PDFParse({ data: buffer })`, never the old `pdf(buffer)` default export — that no longer exists in v2
- Always call `await parser.destroy()` after extraction, even on the success path
- `result.text` is raw unformatted text — Gemini 2.5 Flash handles the structure extraction
- Always handle parse errors — some PDFs are image-based and return empty or near-empty text
- If `result.text.trim()` is empty or very short — return error to user: "Could not extract text from this PDF. Please try a different file."
