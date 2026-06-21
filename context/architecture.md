# Architecture

## Stack

| Layer                          | Tool                     | Purpose                                          |
| ------------------------------ | ------------------------ | ------------------------------------------------ |
| Framework                      | Next.js 16 (App Router)  | Full stack framework                             |
| Auth + DB + Storage + Realtime | InsForge                 | Entire backend                                   |
| Local browser                  | Playwright (via Stagehand LOCAL) | Company research — browsing company public pages, no cloud account |
| AI browser control             | Stagehand                | Company page interaction and content extraction  |
| Job Discovery                  | ITPro.lk API              | Job search and discovery (Sri Lanka tech jobs)   |
| AI model                       | Google Gemini 2.5 Flash  | Matching, research synthesis, extraction         |
| Analytics                      | PostHog                  | Event tracking and dashboard charts              |
| Charting                       | recharts                 | Dashboard analytics charts (line/area, bar)      |
| PDF generation                 | @react-pdf/renderer      | Resume PDF rendering                             |
| Styling                        | Tailwind CSS + shadcn/ui | UI components and styling                        |
| Language                       | TypeScript strict        | Throughout                                       |

---

## Folder Structure

```
/
├── AGENTS.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── proxy.ts                                 → Optimistic session check gating protected routes (Next.js 16 renamed middleware.ts → proxy.ts)
├── instrumentation-client.ts                → PostHog browser client init (Next.js 16 auto-loads this — no lib/posthog-client.ts, no manual import in layout.tsx)
├── app/
│   ├── layout.tsx                          → Root layout, PostHog provider
│   ├── page.tsx                            → Homepage
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                   → Login page
│   ├── dashboard/
│   │   └── page.tsx                       → Main dashboard
│   ├── profile/
│   │   └── page.tsx                       → Profile form + resume management
│   ├── find-jobs/
│   │   ├── page.tsx                       → Find Jobs page — search controls + jobs list
│   │   └── [id]/
│   │       └── page.tsx                   → Individual job details page
│   └── api/
│       ├── auth/
│       │   ├── callback/route.ts          → Exchanges OAuth code for tokens via createAuthActions(), redirects to /dashboard
│       │   └── refresh/route.ts           → createRefreshAuthRouter() — session refresh endpoint
│       ├── agent/
│       │   ├── find/route.ts              → Trigger ITPro.lk job discovery
│       │   └── research/route.ts          → Trigger company research agent
│       ├── resume/
│       │   ├── generate/route.ts          → Generate base resume PDF from profile
│       │   ├── extract/route.ts           → Extract profile data from uploaded resume PDF
│       │   ├── view/route.ts              → Stream current resume PDF inline (Content-Disposition: inline)
│       │   └── download/route.ts          → Stream current resume PDF as a download (Content-Disposition: attachment)
├── agent/
│   ├── itpro.ts                           → ITPro.lk job discovery orchestration — fetch, filter, score, save to DB
│   ├── matcher.ts                         → Gemini 2.5 Flash job matching logic — scoreJobAgainstProfile()
│   ├── logger.ts                          → logAgentError() — writes to agent_logs, shared by every agent function
│   ├── research.ts                        → Company research — Browserbase + Stagehand + Gemini 2.5 Flash
│   ├── extractor.ts                       → Gemini 2.5 Flash job description extraction + structuring
│   └── types.ts                           → Agent-specific TypeScript types (ScoredJob)
├── actions/
│   ├── auth.ts                            → signInWithGoogle, signInWithGithub, signOutAction (Server Actions)
│   ├── profile.ts                         → Profile save + update
│   └── jobs.ts                            → Job status updates
├── components/
│   ├── ui/                                → shadcn/ui components only
│   ├── shared/                            → Cross-feature components used by more than one page/feature folder
│   │   ├── ActionResultDialog.tsx         → Centered success/error popup for action buttons (Save, Extract, Generate) — see ui-registry.md
│   │   └── SignOutButton.tsx              → Client component — calls posthog.reset() then submits signOutAction. Moved here in Feature 14 once AppNavbar started rendering it on every protected page, not just Dashboard
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── AppNavbar.tsx                  → App-shell navbar (Dashboard/Find Jobs/Profile + SignOutButton) — distinct from the marketing Navbar.tsx
│   ├── homepage/
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   └── Features.tsx
│   ├── dashboard/
│   │   ├── StatsBar.tsx
│   │   ├── RecentActivity.tsx
│   │   ├── AnalyticsCharts.tsx            → Client component (recharts) — Jobs Found Over Time, Company Research Activity, Match Score Distribution
│   │   └── IncompleteProfileBanner.tsx    → Real calculateProfileCompletion() check, renders only when profile is incomplete
│   ├── profile/
│   │   ├── ProfileForm.tsx
│   │   ├── ResumeUpload.tsx
│   │   ├── ResumePreview.tsx
│   │   └── CompletionIndicator.tsx
│   ├── find-jobs/
│   │   ├── SearchControls.tsx
│   │   ├── JobsTable.tsx
│   │   ├── JobFilters.tsx
│   │   └── JobsPagination.tsx
│   └── job-details/
│       ├── JobInfo.tsx
│       ├── MatchScore.tsx
│       ├── JobDescription.tsx
│       ├── CompanyResearch.tsx
│       └── JobActions.tsx
├── lib/
│   ├── insforge-client.ts                 → InsForge browser client instance
│   ├── insforge-server.ts                 → InsForge server client
│   ├── stagehand.ts                       → Stagehand LOCAL initialisation — local Playwright Chromium, no Browserbase account needed
│   ├── itpro.ts                           → ITPro.lk API client
│   ├── posthog-server.ts                  → PostHog server client (singleton, see instrumentation-client.ts for the browser client)
│   ├── posthog-analytics.ts               → getAnalyticsChartsData() (Feature 17) — reads events back via PostHog's Query API (HogQL), separate credential/surface from posthog-server.ts's write-only capture
│   ├── resume.ts                          → pdf-parse extraction + Gemini 2.5 Flash resume content/profile generation (server-only)
│   ├── resume-pdf.tsx                     → @react-pdf/renderer <Document> component — server-only, used only by app/api/resume/generate
│   ├── gemini.ts                          → generateContentWithRetry() — shared by every Gemini call in the project
│   ├── dashboard.ts                       → getStatsBarData() (Feature 15), getRecentActivity() (Feature 16) — real Dashboard DB queries
│   ├── rate-limit.ts                      → checkRateLimit() — in-memory sliding window, valid only because the app runs as a single Node process (see Hosting)
│   ├── url-safety.ts                      → isPrivateOrLocalUrl() — SSRF guard checked before Stagehand navigates to any company.website-derived URL
│   └── utils.ts                           → MATCH_THRESHOLD, MAX_JOBS_PER_RUN, formatRelativeTime()
└── types/
    └── index.ts                           → Global TypeScript types
```

---

## System Boundaries

| Folder        | Owns                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `app/`        | Pages and API routes only. No business logic.                                                          |
| `agent/`      | All agent logic. ITPro.lk discovery, company research, matching, extraction. Nothing here touches React. |
| `actions/`    | Server Actions for UI-triggered mutations only. Profile save, profile update.                          |
| `components/` | UI only. No data fetching logic. No direct DB calls. `components/shared/` holds components used by more than one feature folder (e.g. `ActionResultDialog`) — a component used by only one feature stays in that feature's own folder, don't pre-emptively move it to `shared/`. |
| `lib/`        | Third party client initialisation and shared utilities only.                                           |
| `types/`      | TypeScript types shared across the project.                                                            |

---

## Data Flow

### UI Mutations (Server Actions)

```
User interaction in component
        ↓
Server Action in actions/
        ↓
InsForge DB write
        ↓
Revalidate or redirect
```

### Agent Operations (API Routes)

```
User clicks Find Jobs
        ↓
API route in app/api/agent/find
        ↓
Calls agent/itpro.ts
        ↓
ITPro.lk API returns job listings
        ↓
Gemini 2.5 Flash scores each job against user profile
        ↓
Agent writes results to InsForge DB
        ↓
Page data revalidated
```

### Company Research (API Routes)

```
User clicks Research Company on job details page
        ↓
API route in app/api/agent/research
        ↓
Calls agent/research.ts
        ↓
Local Stagehand session opens (Playwright Chromium)
        ↓
Navigates to company homepage + sub pages
        ↓
Gemini 2.5 Flash synthesizes dossier from extracted content
        ↓
Dossier saved to jobs.company_research
        ↓
Page data revalidated
```

### Resume Operations (API Routes)

```
User uploads resume or clicks Generate
        ↓
API route in app/api/resume/
        ↓
Gemini 2.5 Flash processes content
        ↓
@react-pdf/renderer renders PDF buffer
        ↓
New PDF uploaded to InsForge Storage
        ↓
URL saved to profiles table
```

---

## InsForge Database Schema

### `profiles`

| Column              | Type        | Notes                                        |
| ------------------- | ----------- | -------------------------------------------- |
| id                  | uuid        | References auth.users                        |
| full_name           | text        |                                              |
| email               | text        | Pre-filled from auth                         |
| phone               | text        |                                              |
| location            | text        | City, country                                |
| current_title       | text        | Most recent job title                        |
| experience_level    | text        | junior / mid / senior / lead                 |
| years_experience    | integer     |                                              |
| skills              | text[]      | Array of skill tags                          |
| industries          | text[]      | Industries worked in                         |
| work_experience     | jsonb       | Array of up to 3 roles                       |
| education           | jsonb       | Degree, field, institution, year             |
| job_titles_seeking  | text[]      | Roles they want                              |
| remote_preference   | text        | remote / onsite / hybrid / any               |
| preferred_locations | text[]      | Optional preferred locations                 |
| salary_expectation  | text        | Optional                                     |
| cover_letter_tone   | text        | formal / casual / enthusiastic               |
| linkedin_url        | text        |                                              |
| portfolio_url       | text        |                                              |
| work_authorization  | text        | citizen / permanent_resident / visa_required |
| resume_pdf_url      | text        | InsForge Storage URL of current resume       |
| resume_pdf_key      | text        | Storage key — removed before each re-upload to enforce one resume per user |
| is_complete         | boolean     | True when all required fields filled         |
| created_at          | timestamptz |                                              |
| updated_at          | timestamptz |                                              |

### `agent_runs`

| Column             | Type        | Notes                        |
| ------------------ | ----------- | ---------------------------- |
| id                 | uuid        |                              |
| user_id            | uuid        | References profiles          |
| status             | text        | running / completed / failed |
| job_title_searched | text        |                              |
| location_searched  | text        |                              |
| jobs_found         | integer     | Total jobs discovered        |
| started_at         | timestamptz |                              |
| completed_at       | timestamptz |                              |

### `jobs`

| Column             | Type        | Notes                                          |
| ------------------ | ----------- | ---------------------------------------------- |
| id                 | uuid        |                                                |
| run_id             | uuid        | References agent_runs — null if from URL input |
| user_id            | uuid        | References profiles                            |
| source             | text        | search / url                                   |
| source_url         | text        | Original job listing URL                       |
| external_apply_url | text        | Direct company apply URL                       |
| title              | text        |                                                |
| company            | text        |                                                |
| website            | text        | Company homepage from ITPro.lk's `website` field — null on ~1/3 of listings, falls back to `https://www.{company}.com` for research |
| location           | text        | Parsed from ITPro.lk's `summary` text (e.g. "Colombo"/"Remote") — its `location` field is an opaque id with no real value |
| salary             | text        | If available — never populated for ITPro.lk jobs, the API has no salary field at all |
| job_type           | text        | Free text parsed from ITPro.lk's `summary` (e.g. "Full-time"/"Internship") — not a fixed enum |
| about_role         | text        | 2-3 sentence summary                           |
| responsibilities   | text[]      | Bullet points                                  |
| requirements       | text[]      | Bullet points                                  |
| nice_to_have       | text[]      | Optional                                       |
| benefits           | text[]      | Optional                                       |
| about_company      | text        | Brief company description                      |
| match_score        | integer     | 0-100 scored against main profile              |
| match_reason       | text        | Gemini 2.5 Flash explanation                             |
| matched_skills     | text[]      | Skills user has that match                     |
| missing_skills     | text[]      | Skills user lacks                              |
| company_research   | jsonb       | Company dossier from research agent            |
| researched_at      | timestamptz | Set when company_research is saved — null on rows researched before Feature 16 added this column. Powers Recent Activity's "Researched X" timestamp; found_at can't be reused for this since it's the discovery time, not the research time |
| found_at           | timestamptz |                                                |

### `agent_logs`

| Column     | Type        | Notes                            |
| ---------- | ----------- | -------------------------------- |
| id         | uuid        |                                  |
| run_id     | uuid        | References agent_runs            |
| user_id    | uuid        | References profiles              |
| message    | text        | Human readable log entry         |
| level      | text        | info / success / warning / error |
| job_id     | uuid        | Optional — related job           |
| created_at | timestamptz |                                  |

---

## InsForge Storage

| Bucket  | Path                         | Contents                  |
| ------- | ---------------------------- | ------------------------- |
| resumes | resumes/{user_id}/resume.pdf | Current active resume PDF |

Access: authenticated users only, own files only.

---

## Authentication

- Provider: InsForge Auth — real package is `@insforge/sdk` (not `@insforge/ssr`, which does not exist). Next.js helpers live under its `/ssr` and `/ssr/middleware` subpath exports.
- Methods: Google OAuth, GitHub OAuth
- Protected routes: /dashboard, /profile, /find-jobs, /find-jobs/[id]
- Public routes: /, /login
- This Next.js version renamed `middleware.ts` → `proxy.ts` (exports a `proxy()` function, defaults to Node.js runtime). `proxy.ts` at the project root calls `updateSession()` for an optimistic cookie check on every protected route — real authorization still happens close to the data (Server Components/Actions/Route Handlers via `createServerClient()`), per Next.js's own auth guidance.
- On login → redirect to /dashboard
- Session cookies (`insforge_access_token`, `insforge_refresh_token`) are managed entirely by the SDK's SSR helpers — never read/write them manually.

---

## InsForge Client Pattern

Three contexts — never mix them:

```typescript
// lib/insforge-server.ts
// Server Components, Route Handlers, Server Actions, agent code — full client, RLS-scoped to the session cookie
import { createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";

export const createInsforgeServer = async () => {
  const cookieStore = await cookies();
  return createServerClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    cookies: cookieStore, // only `.get` is used
  });
};

// lib/insforge-client.ts
// Client Components — read-only auth surface only (getCurrentUser, getProfile, getPublicAuthConfig)
import { createBrowserClient } from "@insforge/sdk/ssr";

export const insforge = createBrowserClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});

// actions/auth.ts
// Server Actions — the only place sign-in/sign-out/OAuth-exchange mutations happen,
// since they need to write the httpOnly session cookies
import { createAuthActions } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";

export async function signInWithGoogle() {
  const auth = createAuthActions({ cookies: await cookies() });
  return auth.signInWithOAuth("google", { redirectTo: "/api/auth/callback" });
}
```

`proxy.ts` uses the lighter `@insforge/sdk/ssr/middleware` subpath (`updateSession()` + cookie helpers only — no full client bundled there).

---

## Stagehand LOCAL Session Pattern

```typescript
// Company research — single local Chromium instance, sequential page visits, headless always on
const stagehand = createLocalStagehand();
await stagehand.init();
// ... extract() calls ...
await stagehand.close();
```

No cloud account, no API key/project ID for the browser itself — `lib/stagehand.ts` is the only place this gets constructed.

**Deployment note:** Stagehand LOCAL needs a persistent Node process with Playwright's Chromium binary present on disk at request time. Works on Docker, a VPS, Railway, Render, or Fly.io. Does **not** work on vanilla Vercel serverless functions without separate work (ephemeral filesystem, execution-time limits) — not a concern for now, just a known constraint if a serverless target is chosen later.

---

## Job Discovery Pattern

**ITPro.lk API — fetch recent jobs, filter client-side**

```typescript
const response = await fetch("https://itpro.lk/api/v1/jobs?limit=100");
// No API key required for reads — public endpoint
const allJobs: ITProJob[] = await response.json();
// Each job: id, title, description (HTML), summary, type_id, category_id,
//           location (opaque numeric id — no public lookup), company,
//           website, views_count, created_on

// The API ignores page/q/keyword/search/title params — always returns
// the same recent-jobs feed, so search happens here instead of server-side
const matches = allJobs.filter((job) =>
  `${job.title} ${job.description}`
    .toLowerCase()
    .includes(jobTitle.toLowerCase()),
);
```

---

## Company Research Pattern

```typescript
// Single session — visits company homepage and sub pages sequentially
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY!,
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  browserbaseSessionID: session.id,
  modelName: "google/gemini-2.5-flash",
  modelClientOptions: { apiKey: process.env.GEMINI_API_KEY! },
});

await stagehand.init();
const page = stagehand.page;

// Clean company name and construct homepage URL
const cleanName = companyName
  .replace(/\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?).*$/i, "")
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "");

const homepageUrl = `https://www.${cleanName}.com`;

// Navigate and extract — graceful fallback if page not found
try {
  await page.goto(homepageUrl);
  await page.waitForLoadState("networkidle");
  const content = await stagehand.extract({ instruction: "..." });
} catch (error) {
  // Log and continue — Gemini 2.5 Flash will synthesize from what was found
  await logAgentError(jobId, error);
}

// Always close session when done
await stagehand.close();
```

---

## Hosting

**Single droplet, not split frontend/backend** — decided because Stagehand LOCAL needs a persistent Node process with Chromium on disk at request time, which vanilla Vercel serverless functions can't provide. Rather than splitting the app (Vercel for everything except a separate Stagehand microservice on DigitalOcean), the whole Next.js app — pages, all API routes, Server Actions, Stagehand — runs as one Docker container on one DigitalOcean droplet. Simpler ops, one bill, no cross-service network hop/auth between a Vercel function and a DO microservice.

- **Container**: single multi-stage `Dockerfile`, built from Playwright's official base image for the runtime stage (ships Chromium's system dependencies already installed — avoids hand-rolling the apt-get list Playwright needs).
- **Reverse proxy**: Caddy, not Nginx+certbot — automatic HTTPS with zero manual certificate management. The droplet has no purchased domain, so it uses a free `nip.io` wildcard-DNS hostname (`64.227.162.172.nip.io`, which resolves straight to the droplet IP) as `DOMAIN` in `.env.production`; Caddy provisions a real Let's Encrypt cert for it and redirects HTTP→HTTPS. Swap `DOMAIN` for a real domain later and nothing else changes.
- **Registry**: GitHub Container Registry (GHCR), not DigitalOcean Container Registry — free, and CI already has a `GITHUB_TOKEN` with no extra account to wire up.
- **InsForge stays on its managed cloud** (`*.insforge.app`) — no self-hosting. Revisit only if its free tier's limits actually become a problem.
- **Rate limiting is in-memory** (`lib/rate-limit.ts`) — valid specifically because this is one droplet running one Node process. The moment this runs as more than one instance (horizontal scaling, multiple droplets), it needs a shared store (e.g. Redis) instead.
- **CI "testing"** = `tsc --noEmit` + `eslint` + `next build` on every PR/push — there is no test framework installed in this project; do not assume Jest/Vitest/Playwright-test exist without checking `package.json` first.
- `NEXT_PUBLIC_APP_URL` is `http://localhost:3000` in `.env.local` for dev; in production it is the GitHub Actions **variable** `https://64.227.162.172.nip.io` (build-time inlined — see code-standards.md's Environment Variables note). OAuth works on the droplet because the flow runs over HTTPS: the InsForge SDK stamps its session cookies `Secure` whenever `NODE_ENV === "production"` (`@insforge/sdk/dist/ssr/middleware.js`), and a `Secure` cookie is silently dropped by the browser on any plain-HTTP origin — which is exactly why login bounced back to `/login` (with no `?error=`) before TLS was in place. The Google/GitHub OAuth apps point their redirect URI at InsForge's own callback, not ours, so they need no change when `DOMAIN`/`NEXT_PUBLIC_APP_URL` changes; only InsForge's `allowedRedirectUrls` would (currently empty = permissive).

---

## Invariants

Rules the AI agent must never violate:

- API routes contain no UI logic. Components contain no DB logic.
- Agent code in `/agent` never imports from `/components` or `/actions`.
- Server Actions never call agent functions. Agent functions are only called from API routes.
- All InsForge server-side writes use `createInsforgeServer()` — never the browser client.
- No hardcoded hex values or raw Tailwind color classes in components — use CSS variables from ui-tokens.md.
- Every Stagehand action is wrapped in try/catch. Failures are logged to agent_logs, never thrown to crash the run.
- Company research always returns a dossier — even if browser research fails, Gemini 2.5 Flash synthesizes from company name and job description alone. If the Gemini synthesis call itself fails (not just the browser phase), `agent/research.ts`'s `buildFallbackDossier()` returns a deterministic, non-AI dossier from already-known job/profile data instead — `researchCompany()` never returns `success: false`, only `degraded: true`. Never return empty.
- Browserbase sessions are always closed with stagehand.close() when done — never leave sessions open.
- Always scope InsForge queries to the current user_id — never query without a user filter.
- ITPro.lk API has no server-side search — `jobTitle`/`location` filtering always happens client-side on the fetched batch, never assume the API filtered it.
- jobs.source is always 'search' or 'url' — never any other value.
- Every Gemini call in `agent/`/`lib/` uses the literal model string `"gemini-2.5-flash"` (or `"google/gemini-2.5-flash"` for Stagehand's `modelName`) — never a different model name without updating this file first. A wrong/unavailable model string fails silently as a generic capacity error, not an obvious "model not found" — this has happened twice already (see Notes).
- `agent/research.ts` validates `deriveHomepageUrl()`'s result with `isPrivateOrLocalUrl()` (`lib/url-safety.ts`) before every `page.goto()` — `job.website` is third-party ITPro.lk data, not something we control, so Stagehand's browser must never be pointed at localhost/private/link-local addresses.
- `/api/agent/find` and `/api/agent/research` are rate limited per user via `checkRateLimit()` (`lib/rate-limit.ts`) — both run expensive Gemini/browser-automation work against a quota-limited key.
