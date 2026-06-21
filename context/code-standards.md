# Code Standards

Implementation rules and conventions for the entire project. The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset

The AI agent on this project operates as a senior engineer. This means:

- **Think before implementing** — understand what is being built and why before writing a single line
- **Read context files first** — never assume, always verify against architecture.md and project-overview.md
- **Scope is sacred** — only build what the current feature requires. Never go beyond scope even if it seems helpful
- **Every feature must be testable** — if it cannot be verified immediately after implementation, it is incomplete
- **Clean over clever** — simple readable code that a junior developer can understand is always preferred over clever abstractions
- **One thing at a time** — complete one feature fully before touching the next
- **Failures are expected** — wrap agent operations in try/catch, log failures, never let one failure crash everything

---

## TypeScript

- Strict mode enabled in tsconfig.json — no exceptions
- Never use `any` — use `unknown` and narrow the type
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why
- All function parameters and return types must be explicitly typed
- Use `type` for object shapes and unions — use `interface` only for extendable component props
- All async functions must have proper error handling — never let promises float unhandled
- Use `const` by default — only use `let` when reassignment is necessary

---

## Next.js 16 Conventions

- App Router only — no Pages Router
- React 19 — use React 19 APIs throughout
- All components are Server Components by default
- Only add `"use client"` when the component requires:
  - useState or useReducer
  - useEffect
  - Browser APIs
  - Event listeners
  - Third party client-only libraries (PostHog browser side)
- Never add `"use client"` to layout files unless absolutely required
- Data fetching happens in Server Components — never fetch in Client Components directly
- Route handlers live in `app/api/` — never put business logic directly in route handlers
- Server Actions live in `actions/` — never define Server Actions inline in components
- Caching is uncached by default — all dynamic code runs at request time
- Always read Next.js documentation before implementing any Next.js specific feature — APIs may differ from training data

---

## File and Folder Naming

- Folders: kebab-case — `job-details`, `agent-controls`
- Component files: PascalCase — `StatsBar.tsx`, `RecentActivity.tsx`
- Utility files: camelCase — `browserbase.ts`, `posthog-client.ts`
- Type files: camelCase — `index.ts`
- API route files: always `route.ts`
- Server Action files: camelCase — `profile.ts`, `jobs.ts`
- One component per file — never export multiple components from one file
- Index files only in `components/ui/` — never barrel export from other folders

---

## Component Structure

Every component follows this exact order:

```typescript
"use client"; // only if needed

// 1. External imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Internal imports
import { StatsCard } from "@/components/dashboard/StatsCard";

// 3. Type definitions
type Props = {
  jobId: string;
  matchScore: number;
};

// 4. Component
export function ComponentName({ jobId, matchScore }: Props) {
  // state
  // derived values
  // handlers
  // return JSX
}
```

- Never use default exports for components — always named exports
- Props type defined directly above the component — not in a separate types file unless shared
- No inline styles — all styling via Tailwind classes using CSS variables from ui-tokens.md

---

## API Route Handlers

```typescript
// app/api/agent/find/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // validate body
    // call agent function
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[agent/find]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- Every route handler has a try/catch
- Every route handler validates the request body before processing
- Errors are logged with the route path as prefix: `[agent/find]`
- Always return `{ success: boolean, data?: T, error?: string }`
- Never return raw data without the success wrapper
- Any route that triggers expensive agent work (Gemini calls, Stagehand/browser automation) calls `checkRateLimit()` from `lib/rate-limit.ts` immediately after the auth check, keyed by `` `${routeName}:${userId}` ``, before any DB or agent work runs. Returns `429` with a `Retry-After` header on rejection. Currently applied to `/api/agent/find` and `/api/agent/research` — apply to any future agent-triggering route too.

---

## Server Actions

```typescript
// actions/profile.ts

"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function saveProfile(formData: ProfileFormData) {
  try {
    const insforge = await createInsforgeServer();
    // validate
    // write to DB
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[actions/profile]", error);
    return { success: false, error: "Failed to save profile" };
  }
}
```

- Every Server Action has a try/catch
- Every Server Action returns `{ success: boolean, error?: string }`
- Always call `revalidatePath` after mutations that affect page data
- Never throw from Server Actions — always return the error

---

## Agent Code

```typescript
// agent/itpro.ts

export async function discoverJobs(
  jobTitle: string,
  location: string,
  profile: Profile,
  runId: string,
): Promise<{ success: boolean; jobs?: Job[]; error?: string }> {
  try {
    // implementation
    return { success: true, jobs };
  } catch (error) {
    await logAgentError(runId, null, error);
    return { success: false, error: String(error) };
  }
}
```

- Every agent function returns `{ success: boolean, error?: string }`
- Every agent function has a try/catch — never let one failure crash the run
- Errors are always logged to agent_logs table before returning
- Agent functions never import from `components/` or `actions/`
- Agent functions never use React hooks or browser APIs

---

## InsForge Client Usage

```typescript
// Browser context — Client Components only
import { insforge } from "@/lib/insforge-client";

// Server context — Server Components, Route Handlers, Server Actions, Agent
import { createInsforgeServer } from "@/lib/insforge-server";
const insforge = await createInsforgeServer();
```

- Never use the browser client in server context
- Never use the server client in browser context
- Always await createInsforgeServer() — it reads cookies asynchronously
- Always scope every query to the current user_id — never query without a user filter

---

## Error Handling

- Never use empty catch blocks — always log or handle
- Console errors always include context prefix: `[component/function name]`
- User-facing errors must be human readable — never expose raw error messages
- Agent errors go to agent_logs table — never surface raw agent errors to the UI
- API route errors return `status: 500` with generic message — never expose internals

---

## Security Practices

- **Security headers** are set globally in `next.config.ts`'s `headers()` (CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) — never add a per-route header workaround instead of extending the shared `securityHeaders` array there. `connect-src` in the CSP must list every third-party origin the *browser* talks to directly (InsForge, PostHog) — server-only origins (Gemini, PostHog Query API) don't need to be listed since the browser never calls them directly. `style-src`/`font-src` must include `https://fonts.googleapis.com`/`https://fonts.gstatic.com` — PostHog's session-recording script (`rrweb-record.js`) loads Google Fonts for its own overlay at runtime, independent of `next/font` (which self-hosts `Inter` and needs no CSP allowance).
- **OAuth cookies**: the PKCE code-verifier cookie in `actions/auth.ts` sets `secure` from `NEXT_PUBLIC_APP_URL`'s protocol (`IS_HTTPS_APP_URL`), never hardcode `secure: true` — a `Secure` cookie is silently dropped by the browser on a plain-HTTP origin (no domain/TLS yet, see architecture.md's Hosting section), which breaks the OAuth round trip with no client-visible error beyond a generic exchange failure.
- **SSRF guard on agent-driven browser navigation**: any code that points Stagehand's browser at a URL derived from third-party data (currently `agent/research.ts`'s `deriveHomepageUrl(job.website, ...)`) must check it with `isPrivateOrLocalUrl()` (`lib/url-safety.ts`) first and refuse to navigate (log via `logAgentError`, degrade gracefully) if it resolves to a private/local address.
- **Rate limiting** — see the API Route Handlers section above.

---

## PostHog Events

All PostHog events must use these exact event names. Never invent new event names without adding them here first.

| Event                 | When                                                   | Key Properties              |
| --------------------- | ------------------------------------------------------- | --------------------------- |
| `job_search_started`  | Find Jobs button clicked                                 | userId, jobTitle, location  |
| `job_found`           | Each job discovered and saved                            | userId, source, matchScore  |
| `profile_completed`   | User saves complete profile for first time               | userId                      |
| `company_researched`  | Company research dossier generated                       | userId, jobId, company      |
| `hero_cta_clicked`    | Homepage hero CTA clicked (client-side)                  | label                       |
| `bottom_cta_clicked`  | Homepage bottom CTA section clicked (client-side)        | label                       |
| `sign_in_initiated`   | OAuth sign-in started, server-side (`actions/auth.ts`)   | provider                    |
| `sign_in_succeeded`   | OAuth code exchange succeeded (`api/auth/callback`)      | —                            |
| `sign_in_failed`      | OAuth code exchange failed (`api/auth/callback`)         | reason                      |
| `signed_out`          | User signs out, server-side (`actions/auth.ts`)          | —                            |

These ten events are the only events in this project. Do not add more without updating this list first.

`job_found` powers the Jobs Found Over Time and Match Score Distribution dashboard charts.
`company_researched` powers the Company Research Activity dashboard chart.
`hero_cta_clicked`/`bottom_cta_clicked`/`sign_in_initiated`/`sign_in_succeeded`/`sign_in_failed`/`signed_out` power the "Analytics basics (wizard)" dashboard (CTA clicks over time, sign-in conversion funnel, sign-in success vs failure, daily active signers-in, sign-outs over time).
Always fire these with correct properties.

---

## Environment Variables

All environment variables defined in `.env.local` for development. Never hardcode any key, URL, or secret anywhere in the codebase.

| Variable                        | Used In                |
| ------------------------------- | ---------------------- |
| `NEXT_PUBLIC_INSFORGE_URL`      | lib/insforge-client.ts, lib/insforge-server.ts, actions/auth.ts, app/api/auth/ |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | lib/insforge-client.ts, lib/insforge-server.ts, actions/auth.ts, app/api/auth/ |
| `NEXT_PUBLIC_APP_URL`           | actions/auth.ts (OAuth `redirectTo`) |
| `BROWSERBASE_API_KEY`           | lib/browserbase.ts     |
| `BROWSERBASE_PROJECT_ID`        | lib/browserbase.ts     |
| `GEMINI_API_KEY`                | agent/ functions       |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | instrumentation-client.ts, lib/posthog-server.ts |
| `NEXT_PUBLIC_POSTHOG_HOST`      | instrumentation-client.ts, lib/posthog-server.ts (ingestion-only host, e.g. `https://us.i.posthog.com` — cannot serve authenticated reads) |
| `POSTHOG_API_HOST`              | lib/posthog-analytics.ts (app/API host, e.g. `https://us.posthog.com` — different from `NEXT_PUBLIC_POSTHOG_HOST`, never expose to the browser) |
| `POSTHOG_PERSONAL_API_KEY`      | lib/posthog-analytics.ts (Query: Read scope — never expose to the browser) |
| `POSTHOG_PROJECT_ID`            | lib/posthog-analytics.ts (Query API target project — never expose to the browser) |

`NEXT_PUBLIC_` prefix means the variable is exposed to the browser. Never add `NEXT_PUBLIC_` to secret keys.

**In the Docker deploy pipeline, this split also means a build-time vs. runtime split**: every `NEXT_PUBLIC_*` var gets inlined into the client bundle at `next build` time and must be passed as a `--build-arg`/`build-args:` to the Docker build (see `Dockerfile`'s `ARG`/`ENV` block and `.github/workflows/deploy.yml`) — setting it via `docker run -e` or `env_file` at container runtime does nothing, the bundle is already compiled by then. Every non-`NEXT_PUBLIC_` var is the opposite — read via `process.env` at runtime inside the container, never needed at build time, and never passed to GitHub Actions at all (lives only in `.env.production` on the droplet). See `.claude/skills/deploy` for the full breakdown.

---

## Match Threshold

The job match threshold is defined once as a constant. Never hardcode this value anywhere else.

```typescript
// lib/utils.ts
export const MATCH_THRESHOLD = 70;
```

Import and use `MATCH_THRESHOLD` everywhere this value is needed.

---

## Job Discovery Run Cap

`lib/utils.ts` also exports `MAX_JOBS_PER_RUN = 20` — caps how many filtered jobs `agent/itpro.ts` scores per search. Scoring is sequential (one Gemini call per job, ~1-3s each), so an uncapped broad title match against the 100-job ITPro.lk batch could queue dozens of calls in a single request. Never remove this cap without replacing sequential scoring with something that doesn't risk the same Gemini rate limit hit encountered during Feature 07.

---

## Shared Gemini Retry Helper

Every Gemini call in the project goes through `generateContentWithRetry()` in `lib/gemini.ts` (3 attempts, backoff on `429`/`503`) — never call `ai.models.generateContent()` directly. `lib/resume.ts`, `agent/matcher.ts`, and `agent/research.ts` all import it.

The literal model string is always `"gemini-2.5-flash"` (or `"google/gemini-2.5-flash"` for Stagehand's `modelName` config) — copy it from an existing call site (`agent/matcher.ts`, `lib/resume.ts`, `lib/stagehand.ts`) rather than typing it from memory. A wrong or unavailable model string doesn't fail loudly — it comes back as a generic capacity/quota-shaped error, which already cost real debugging time twice in this project (see `progress-tracker.md`'s Notes on the `gemini-3.5-flash` → `gemini-2.5-flash` switch, and again when `agent/research.ts` briefly used `gemini-3.1-flash-lite`).

---

## Agent Error Logging

`agent/logger.ts` exports `logAgentError(insforge, runId, userId, jobId, error)` — every agent function's catch block calls this before returning `{ success: false, error }`. `jobId` is `null` for run-level failures (e.g. the ITPro.lk fetch itself failing) and the specific job's id for a per-job failure (e.g. one job's Gemini call or DB insert failing without aborting the rest of the run).

---

## Import Aliases

Always use the `@/` alias — never use relative imports that go up more than one level.

```typescript
// Correct
import { Button } from "@/components/ui/button";
import { insforge } from "@/lib/insforge-client";
import { MATCH_THRESHOLD } from "@/lib/utils";

// Never
import { Button } from "../../../components/ui/button";
```

---

## Comments

- No comments explaining what the code does — code must be self-explanatory
- Comments only for why — explaining a non-obvious decision
- Agent functions may have a brief comment explaining the Browserbase or Stagehand strategy
- Never leave TODO comments in committed code

---

## Dependencies

Never install a new package without a clear reason. Before installing anything check:

1. Does shadcn/ui already have this component?
2. Does Next.js already provide this functionality?
3. Is there a simpler native solution?

Approved dependencies for this project:

- `@insforge/ssr` — InsForge client
- `@browserbasehq/sdk` — Browserbase sessions
- `@browserbasehq/stagehand` — AI browser control
- `@google/genai` — Gemini 2.5 Flash API
- `posthog-js` — PostHog browser client
- `posthog-node` — PostHog server client
- `@react-pdf/renderer` — Resume PDF generation
- `pdf-parse` — Extract text from uploaded PDF
- `zod` — Schema validation
- `lucide-react` — Icons
- `recharts` — Dashboard analytics charts (line/area, bar)
- `tailwindcss` — Styling
- `shadcn/ui` components — UI primitives

Do not install any other packages without updating this list first.
