# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Navbar

`components/layout/Navbar.tsx`

Marketing navbar. Logo via `/logo.png`, 3 nav links, dark CTA. Takes an optional `ctaHref` prop (defaults to `/login`) — the homepage passes `/dashboard` when the user is already signed in, `/login` otherwise.

- Wrapper: `w-full border-b border-border bg-surface`
- Inner row: `mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6`
- Nav link: `text-sm font-medium text-text-dark hover:text-text-primary`
- CTA button: `rounded-md bg-text-slate px-4 py-2 text-sm font-medium text-white hover:opacity-90`

### Footer

`components/layout/Footer.tsx`

Same shell as Navbar (logo left, links right), no CTA button.

- Wrapper: `w-full border-t border-border bg-surface`
- Link: `text-sm font-medium text-text-secondary hover:text-text-primary`

### Hero

`components/homepage/Hero.tsx`

Gradient hero with headline, subhead, two CTAs, and the floating dashboard preview screenshot. Takes an optional `ctaHref` prop (defaults to `/login`), same auth-aware pattern as Navbar.

- Gradient section: `.gradient-hero` utility (defined in `globals.css`) + `px-6 pt-20 pb-56 text-center`
- Headline: `text-5xl font-bold leading-tight text-text-primary sm:text-6xl`
- Subhead: `mx-auto mt-6 max-w-xl text-base text-text-secondary`
- Primary CTA (dark): `flex items-center gap-1.5 rounded-md bg-text-slate px-4 py-2 text-sm font-medium text-white hover:opacity-90`
- Secondary CTA (outline): `rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary`
- Dashboard preview wrapper: `-mt-32 bg-background px-6 pb-24`, image is `/images/dashboard-demo.png` (already includes its own browser-chrome frame/shadow — no extra rounding/shadow classes needed)

### HowItWorks

`components/homepage/HowItWorks.tsx`

"Manage Your Job Search With Ease" — heading + 3 feature items (first item highlighted) on the left, `/images/jobs-lists.png` on the right.

- Section: `bg-surface px-6 py-24`
- Grid: `mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center`
- Item list wrapper: `mt-10 divide-y divide-border`
- Item: `py-6` — plain stacked items, divided by `divide-border` lines (no left-border accent on the first item; intentional deviation from the reference design, which highlights item 1 with a purple left border)

### Features

`components/homepage/Features.tsx`

"Apply With More Confidence, Every Time" — mirrors HowItWorks but flipped: `/images/agnet-log.png` on the left, heading + 3 plain stacked items (no left-border accent) on the right.

- Section: `bg-background px-6 py-24`
- Same grid pattern as HowItWorks

### Testimonial

`components/homepage/Testimonial.tsx`

Centered "Success Stories" label + quote + avatar (`/images/user-icon.png`) + name/role. No card container — plain centered text on `bg-surface`.

### CTASection

`components/homepage/CTASection.tsx`

Bottom CTA banner. Same `.gradient-hero` background and same two-button pattern as Hero. Same `ctaHref` prop pattern.

### LoginPage

`app/(auth)/login/page.tsx`

Centered single card on `bg-background`. No design mockup exists for this page — built directly from `ui-tokens.md`/`ui-rules.md`.

- Page wrapper: `flex min-h-screen items-center justify-center bg-background px-6`
- Card: `w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]` — same shadow as the standard card token in `ui-tokens.md`
- Heading: `text-2xl font-bold text-text-primary`
- Provider button (Google/GitHub, identical style): `flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary` — each wraps a `<form action={signInWithGoogle | signInWithGithub}>` (Server Action, no client JS needed)
- Provider icons are inline SVGs defined locally in the page file (`GoogleIcon`, `GithubIcon`) — lucide-react 1.20 ships no brand/logo icons, so this is the established pattern for any future brand icon (e.g. LinkedIn) too
- Error banner (shown via `?error=` search param): `rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error`
- Subhead under heading: `text-sm text-text-secondary`

### DashboardPage

`app/dashboard/page.tsx`
Last updated: 2026-06-21 (Feature 14)

Real dashboard UI, replacing the Feature 02 placeholder. Built against `context/designs/dashboard.png`.

- Page wrapper: `flex min-h-screen flex-col bg-background`, with `<AppNavbar active="Dashboard" />` then `<main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-8 py-6">`
- Layout order: `IncompleteProfileBanner` (conditional, real `calculateProfileCompletion()` check) → `StatsBar` → a `grid flex-1 content-stretch grid-cols-1 gap-4 lg:grid-cols-2` row containing `RecentActivity` then `AnalyticsCharts` (which renders 3 chart cards as a flattened Fragment, so the 2-col grid naturally pairs RecentActivity|CompanyResearchChart on row 1 and JobsOverTimeChart|MatchScoreChart on row 2 — same order as the design)
- **One-viewport-fit pattern**: `main` is `flex-1` inside the `flex flex-col` outer page wrapper, and the chart-row grid is also `flex-1` with `content-stretch` (`align-content: stretch`) so leftover vertical space flows into the grid rows rather than sitting as dead space below the last card — without this, CSS Grid's default `align-content: start` leaves unused height stranded under the grid when content is shorter than the viewport (confirmed by reproducing it: the incomplete-profile and complete-profile states differ by the banner's ~90px, and only one of them naturally fills a fixed-height layout). Chart cards are `flex h-full flex-col` with their `ResponsiveContainer` wrapped in a `min-h-0 flex-1` div (not a fixed height) so the chart itself grows/shrinks to fill whatever the grid row's stretched height is. `RecentActivity`'s `<ul>` is `flex-1 flex-col justify-evenly` for the same reason. Any future dashboard-style page that needs to fill exactly one viewport regardless of conditional content (banners, empty states) should follow this same `flex-1` + `content-stretch` + `min-h-0 flex-1` chain, not fixed pixel heights.
- Mock data (Features 15-17 replace with real DB/PostHog queries) mirrors `dashboard.png` exactly: stats 284/82%/35/28, the same 5 Recent Activity entries, and the same chart data points for all 3 charts — same precedent as Feature 09's find-jobs mock data, for direct visual diffing against the design.

### SignOutButton

File: `components/shared/SignOutButton.tsx`
Last updated: 2026-06-21 (Feature 14 — moved from `components/dashboard/`)

| Property         | Class                                                              |
| ----------------- | ------------------------------------------------------------------ |
| Background        | `bg-surface`                                                       |
| Border             | `border border-border`                                             |
| Border radius      | `rounded-md`                                                       |
| Text — primary     | `text-text-primary`                                                |
| Text — secondary   | none                                                                |
| Spacing            | `px-4 py-2`, label `text-sm font-medium`                           |
| Hover state        | `hover:bg-surface-secondary`                                       |
| Shadow             | none                                                                |
| Accent usage       | none                                                                |

**Pattern notes:**
Moved to `components/shared/` in Feature 14 once `AppNavbar` started rendering it on every protected page (Dashboard/Find Jobs/Profile/Job Details), not just the old Dashboard placeholder — matches `architecture.md`'s own boundary rule ("a component used by only one feature stays in that feature's own folder... `shared/` holds components used by more than one feature folder"). Classes unchanged — still a 1:1 match of the **Secondary/outline button** shared pattern below.

### AppNavbar

File: `components/layout/AppNavbar.tsx`
Last updated: 2026-06-21 (Feature 14 — now renders `SignOutButton`)

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | `bg-surface`                                                         |
| Border             | `border-b border-border`                                            |
| Border radius      | none                                                                  |
| Text — primary     | active link: `text-accent`                                          |
| Text — secondary   | inactive link: `text-text-dark`, hover: `hover:text-text-primary`   |
| Spacing            | wrapper `mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6`, right-side group `flex items-center gap-8` wrapping nav `gap-8` + `SignOutButton` |
| Hover state        | inactive links only — `hover:text-text-primary`                     |
| Shadow             | none                                                                  |
| Accent usage       | `text-accent` on the active nav item only, no underline             |

**Pattern notes:**
App-shell navbar (Dashboard / Find Jobs / Profile) — distinct from the marketing `Navbar.tsx` (logo + CTA, no active-state links). Shares the same wrapper/logo classes as the marketing navbar but adds an `active` prop (`"Dashboard" | "Find Jobs" | "Profile"`) that swaps a link to `text-accent`. Built for Feature 05 (Profile); reused by Find Jobs/Job Details/Dashboard since. **Feature 14 addition**: now renders `SignOutButton` to the right of the nav links (previously only the old Dashboard placeholder had a sign-out button, inline in the page body) — sign-out is now available from every protected page, not just Dashboard. Note: the `context/designs/dashboard.png` mockup shows a purple underline beneath the active "Dashboard" link, which contradicts this component's documented "color-only, no underline" active-state rule — left unchanged in Feature 14 since `AppNavbar` is shared across 4 already-shipped pages and this is a minor, isolated visual difference, not a functional one. Flagged here rather than silently changed; revisit if the developer wants the underline applied project-wide.

### StatsBar

File: `components/dashboard/StatsBar.tsx`
Last updated: 2026-06-21 (Feature 15)

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | `bg-surface`                                                         |
| Border             | `border border-border`                                              |
| Border radius      | `rounded-2xl`                                                         |
| Text — primary     | value `text-3xl font-semibold text-text-primary`                    |
| Text — secondary   | label `text-sm text-text-secondary`, subtitle/trend-suffix `text-xs text-text-muted` |
| Spacing            | card `p-5`, grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`   |
| Hover state        | none — not interactive                                                |
| Shadow             | standard card shadow                                                  |
| Accent usage       | none — trend pill uses the existing Trend Badge token (`bg-success-lightest`/`text-success-darker`), not accent |

**Pattern notes:**
4 stat cards, props-driven (`StatCard[]`) — component itself is unchanged since Feature 14. **Feature 15 update**: `app/dashboard/page.tsx` now sources all four values from `lib/dashboard.ts`'s `getStatsBarData(insforge, userId)` instead of mock data — Total Jobs Found (count), Avg. Match Rate (avg of `match_score`, computed client-side since the SDK's PostgREST builder exposes no `avg()` aggregate), Companies Researched (count where `company_research IS NOT NULL`), Jobs This Week (count where `found_at` within the last 7 days). All four now render via the `subtitle` path ("All time" / "Across all jobs" / "Total researched" / "New this week") — the mock's green trend pills ("+12%"/"+3%") were dropped rather than faked, since `build-plan.md`'s Feature 15 logic only specifies the four raw metrics, not a week-over-week comparison, and there's no stored historical snapshot to diff against. `StatsBar` still supports `trend` for any future card that does have a real comparison to show.

### RecentActivity

File: `components/dashboard/RecentActivity.tsx`
Last updated: 2026-06-21 (Feature 16)

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | `bg-surface`                                                         |
| Border             | `border border-border`, row divider `border-t border-border`        |
| Border radius      | `rounded-2xl`                                                         |
| Text — primary     | entry text `text-sm font-medium text-text-primary`                  |
| Text — secondary   | timestamp `text-xs text-text-muted`                                 |
| Spacing            | card `p-5`, row `py-3`, dot-to-text gap `gap-3`                      |
| Hover state        | none — not interactive                                                |
| Shadow             | standard card shadow                                                  |
| Accent usage       | dot only — see Activity Dots in `ui-tokens.md`                       |

**Pattern notes:**
Props-driven (`ActivityItem[]`, `type: "job_found" | "company_researched"`) — component itself unchanged since Feature 14. Dot colors follow `ui-tokens.md`'s Activity Dots table (job found = success green, company researched = accent purple) — a deliberate 2-color semantic rule rather than reproducing `dashboard.png`'s exact per-row colors 1:1, since the design's own 5 sample dots don't actually follow a consistent type-to-color rule themselves (the same "Found X jobs" type appears in both purple and green across different rows). Each entry renders as a single row (icon + text + timestamp inline, `justify-between`) rather than the design's two-line (text above, timestamp below) — a deliberate compactness tradeoff so the card fits the one-viewport-fit layout (see DashboardPage above), confirmed with the developer.

**Feature 16 update — wired to real data:** `app/dashboard/page.tsx` now sources `activities` from `lib/dashboard.ts`'s `getRecentActivity(insforge, userId)` instead of mock data. Merges two sources sorted by recency, capped at 5: completed `agent_runs` rows with `job_title_searched` set ("Found X jobs for [title]") and `jobs` rows with `researched_at` set ("Researched [company]") — required adding a `researched_at` column to `jobs` since `found_at` only captures discovery time, not when research completed. Timestamps go through the existing `formatRelativeTime()` from `lib/utils.ts`, matching the "X hours ago"/"Yesterday" format already used on Find Jobs.

### AnalyticsCharts

File: `components/dashboard/AnalyticsCharts.tsx`
Last updated: 2026-06-21 (Feature 17)

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | `bg-surface`                                                         |
| Border             | `border border-border`                                              |
| Border radius      | `rounded-2xl`                                                         |
| Text — primary     | chart title `text-base font-semibold text-text-primary`             |
| Text — secondary   | axis labels `#9CA3AF` 12px (recharts inline `tick` prop, not a Tailwind class — recharts doesn't accept CSS variables here) |
| Spacing            | card `p-5`                                                            |
| Hover state        | none                                                                   |
| Shadow             | standard card shadow                                                  |
| Accent usage       | per `ui-tokens.md`'s Dashboard Chart Colors — purple `#7C5CFC` line/gradient (Jobs Found Over Time), blue `#61A8FF` bars (Company Research Activity), green `#10B981` bars (Match Score Distribution) |

**Pattern notes:**
First use of `recharts` in the project (newly approved in `code-standards.md`) — `"use client"` at the top since recharts requires browser APIs. One file housing 3 private, non-exported chart helpers (`JobsOverTimeChart`, `CompanyResearchChart`, `MatchScoreChart`) per `architecture.md`'s single-file plan for this section — same "private helper inside the same file" precedent as `JobDescription.tsx`'s `BulletSection`. The exported `AnalyticsCharts` component returns a bare Fragment of the 3 chart cards (in Company Research → Jobs Over Time → Match Score order) rather than its own grid — relies on the parent page's 2-column grid auto-flowing them alongside `RecentActivity` into the exact row pairing the design shows (see DashboardPage above). Chart color hex values are passed as literal recharts props (`stroke`/`fill`), not Tailwind classes — recharts' SVG props don't resolve CSS custom properties the way Tailwind utility classes do, so this is the one place in the project where literal hex values are correct despite `ui-rules.md`'s "never hardcode hex" rule (the rule targets component className strings, not third-party charting library props that have no Tailwind equivalent).

**Feature 17 update:** each chart helper takes a `hasData: boolean` prop (`hasJobsOverTimeData`/`hasCompanyResearchData`/`hasMatchScoreData` on `AnalyticsCharts`, all defaulting to `true`) — when false, renders `RecentActivity.tsx`'s plain-text empty-state pattern (`<p className="mt-4 text-sm text-text-muted">`) instead of the chart, keeping the same `flex h-full flex-col` card chrome so grid-stretch sizing is unaffected whether a card shows a chart or an empty state. Data now comes from `lib/posthog-analytics.ts`'s `getAnalyticsChartsData()`, which queries PostHog's events directly rather than the InsForge DB (the only dashboard data source that does this — see `progress-tracker.md`).

### IncompleteProfileBanner

File: `components/dashboard/IncompleteProfileBanner.tsx`
Last updated: 2026-06-21 (Feature 14)

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | `bg-surface`                                                         |
| Border             | `border border-border`                                              |
| Border radius      | `rounded-2xl`                                                         |
| Text — primary     | `text-sm font-medium text-text-primary`                             |
| Text — secondary   | `text-sm text-text-secondary`                                       |
| Spacing            | `px-5 py-4`                                                           |
| Hover state        | CTA button `hover:opacity-90`                                        |
| Shadow             | standard card shadow                                                  |
| Accent usage       | CTA button is the **Primary Button** pattern                        |

**Pattern notes:**
Distinct from `ProfileCompletionBanner.tsx` (the ring-based banner on the Profile page itself) — no design mockup shows this banner (the `dashboard.png` reference depicts a complete-profile state), so built directly from `ui-tokens.md`/`ui-rules.md`: a plain white card (never a colored background, per `ui-rules.md`) with a short message + percentage and a "Complete Profile" link to `/profile`. Wired to the real `calculateProfileCompletion()` result against the DB row (not mocked) since that function and data already exist from Feature 06 at no extra cost — only renders when `!completion.isComplete`.

### ProfileCompletionBanner

File: `components/profile/ProfileCompletionBanner.tsx`
Last updated: 2026-06-18

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | `bg-surface`                                                         |
| Border             | `border border-border`                                              |
| Border radius      | `rounded-2xl`                                                        |
| Text — primary     | heading `text-base font-semibold text-text-primary`, ring % `text-base font-semibold text-text-primary` |
| Text — secondary   | body copy `text-sm text-text-secondary`                             |
| Spacing            | `p-6`, missing-tag row `gap-2`                                      |
| Hover state        | none (not interactive)                                               |
| Shadow             | standard card shadow: `shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]` |
| Accent usage       | missing-field pill: `bg-accent-muted text-accent`                   |

**Pattern notes:**
The completion ring is a hand-drawn SVG (`stroke-dasharray`/`stroke-dashoffset`), not a library — kept simple since this is the only progress-ring use case so far. Ring track uses `var(--color-border-light)`, fill uses `var(--color-warning)` (matches the orange ring in the design at 70%); if a future score ever needs color-by-range like the Match Score Bar, that logic should move into this component rather than duplicating the ring markup elsewhere. Missing-field tags reuse the existing **pill badge** shared pattern (`rounded-full bg-accent-muted text-accent`), same classes as Skills tags below — don't invent a separate "warning" pill variant for this.

### TagInput

File: `components/profile/TagInput.tsx`
Last updated: 2026-06-18

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | input/Add button: `bg-surface`                                      |
| Border             | `border border-border`                                              |
| Border radius      | `rounded-md` (input/button), `rounded-full` (chips)                 |
| Text — primary     | input text `text-text-primary`, chip text `text-accent`            |
| Text — secondary   | placeholder `placeholder-text-muted`                                |
| Spacing            | input/button row `gap-2`, chip row `gap-2`, chip padding `px-2 py-0.5` |
| Hover state        | Add button `hover:bg-surface-secondary`, chip remove `×` `hover:opacity-70` |
| Shadow             | none                                                                  |
| Accent usage       | chip background `bg-accent-muted`, chip text/remove `text-accent`, focus ring `ring-1 ring-accent` |

**Pattern notes:**
Reusable chip input — used identically for Skills and Industries on the Profile form (real duplication, worth the shared component; not built for any other field). Enter key or the Add button both commit the current input value as a new chip. Chip styling matches the same pill pattern as the completion banner's missing-field tags — keep that consistent for any future tag/chip UI rather than inventing a new pill shape.

### ActionResultDialog

File: `components/shared/ActionResultDialog.tsx`
Last updated: 2026-06-18 (Feature 08 bug fix)

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | `bg-surface`                                                         |
| Border             | `border border-border`                                              |
| Border radius      | `rounded-2xl`                                                        |
| Text — primary     | message `text-sm font-medium text-text-primary`                     |
| Text — secondary   | none                                                                  |
| Spacing            | `p-6`, inner stack `gap-3`, content width `w-72`                    |
| Hover state        | Close button: **Secondary/outline button** shared pattern, `hover:bg-surface-secondary` |
| Shadow             | standard card shadow (same as every other card in the app)           |
| Accent usage       | none — `text-success`/`text-error` icon only (`CheckCircle`/`AlertCircle` from `lucide-react`, `h-8 w-8`) |

**Pattern notes:**
First and only modal/popup in the project — built on the native `<dialog>` element (`.showModal()`/`.close()`), not a hand-rolled `position: fixed` overlay and not a shadcn/Radix dependency (project has never initialized shadcn — see every other component in this file). The browser's own top-layer handles centering and the backdrop; we only style the dialog box itself plus `backdrop:bg-overlay/50` for the dimmed background, using the `--color-overlay` token that existed in `ui-tokens.md` but had no consumer until this component. This is the documented exception to `ui-rules.md`'s "never use `position: fixed`" rule — see that file.

**Bug fix (discovered after Feature 08, while testing Generate Resume from Profile):** the dialog rendered pinned to the top-left of the screen instead of centered. Root cause: Tailwind v4 Preflight's `* { margin: 0 }` is an author-origin rule and always overrides the browser's UA-stylesheet `dialog:modal { margin: auto }` centering rule regardless of selector specificity. Fixed by adding `m-auto` directly to the dialog's className — see `ui-rules.md`'s Do Nots section for the full explanation. Any future `<dialog>`-based component in this project must include `m-auto` for the same reason.

**This is the standard feedback mechanism for action-trigger buttons project-wide** (Save Profile, Extract from Resume today; Generate Resume from Profile and any future similar action button — e.g. a future Research Company button — should reuse this exact component rather than inline status text or a new toast/banner). Behavior: `type="success"` auto-dismisses after 2.5s (still has a manual Close button for users who don't want to wait); `type="error"` stays open until the user closes it (backdrop click and Escape both close it via the dialog's native `cancel`/`close` events) — errors need to be read and acted on, successes don't need to block the user. Reused as a single instance per consuming component (e.g. one `ActionResultDialog` in `ProfileForm`, driven by one `actionResult` state slot shared across both its action buttons) rather than one dialog per button.

**Does not replace** the existing **inline error text** pattern (`text-xs text-error`/`text-sm text-error`) used for field-level/inline validation that isn't tied to a discrete action button — e.g. `ResumeUpload`'s drag-and-drop file-type/size errors. Use this dialog specifically for "the user clicked a button that does something, here's whether it worked" — not for passive field validation.

### ResumeUpload

File: `components/profile/ResumeUpload.tsx`
Last updated: 2026-06-18 (Feature 08)

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | card `bg-surface`, dropzone default `bg-surface`, dropzone active `bg-accent-muted` |
| Border             | card `border border-border`, dropzone `border-2 border-dashed border-border-muted` (active: `border-accent`) |
| Border radius      | card `rounded-2xl`, dropzone `rounded-md`                            |
| Text — primary     | dropzone filename/prompt/"Uploading..." `text-sm font-medium text-text-primary` |
| Text — secondary   | helper copy `text-sm text-text-secondary`, file-type note `text-xs text-text-muted` |
| Spacing            | card `p-6`, dropzone `px-6 py-10`                                    |
| Hover state        | dropzone is `cursor-pointer` (click-to-browse); drag-over swaps to active styles above; Select Resume button disabled (`disabled:opacity-60`) while uploading |
| Shadow             | standard card shadow (same as ProfileCompletionBanner)               |
| Accent usage       | "Generate Resume from Profile" button uses the **Primary Button** pattern (`bg-accent text-accent-foreground`); "Select Resume" button uses the **Secondary/outline button** shared pattern |

**Pattern notes:**
Client component that now calls the real `uploadResume` Server Action immediately on file select/drop (Feature 06) — client-side PDF-type/5MB checks run first, then an "Uploading..." state replaces the dropzone prompt text during the request. Errors (client validation or server failure) render as `text-xs text-error` directly below the file-type note — this is the **inline error text** pattern (see its own entry under Shared Patterns); any future passive field/upload validation error in this app should use `text-xs text-error` (or `text-sm text-error` for a full-width message) rather than inventing a new error style. This is distinct from `ActionResultDialog` (above) — that's for discrete action-button results (Save, Extract, Generate), this is for drag-and-drop file validation, which isn't a button click. Accepts an `initialFileName` prop so a returning user with an already-uploaded resume sees it reflected instead of the empty dropzone state. Drag-and-drop and click-to-browse both go through the same hidden `<input type="file">`. Icon is `lucide-react`'s `Upload`, `text-text-muted`, matching the muted-icon convention used for non-status iconography elsewhere.

**Feature 08 addition — Generate Resume from Profile:** the previously-static "Generate Resume from Profile" button now calls `POST /api/resume/generate` directly with `fetch` (Resume Operation per `architecture.md`, API route not Server Action), with its own `isGenerating` state — button reads "Generating..." and is disabled while in flight, same `disabled:opacity-60` convention as every other action button. Result reports through its own `ActionResultDialog` instance + `actionResult` state, separate from `ProfileForm`'s instance (one dialog per consuming component, not a shared cross-component dialog). On success, `fileName` state updates to reflect the newly generated file, same as after a manual upload.

**Feature 08 follow-up — View/Download current resume:** when a resume exists (`fileName` set, not mid-upload), the dropzone's filename text becomes two plain `<a>` links instead of static text — `{fileName}` itself links to `/api/resume/view` (`target="_blank"`, opens the PDF inline in a new tab), with a small `Download` link next to it (same-tab, forces a save-to-disk prompt via `Content-Disposition: attachment`). Both links call `e.stopPropagation()` on click so they don't also trigger the parent dropzone's click-to-browse handler. New **text link** pattern: `text-sm font-medium text-accent hover:underline` for the primary (view) link, `text-xs font-medium text-text-secondary hover:underline` for the secondary (download) link — first use of an inline text link anywhere in the project; any future inline link should match one of these two weights depending on whether it's the primary or secondary action. Plain anchor tags, not `fetch`, since both routes are simple authenticated GETs that work via normal browser navigation (cookies sent automatically).

### ProfileForm

File: `components/profile/ProfileForm.tsx`
Last updated: 2026-06-18 (Feature 06)

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | card `bg-surface`, inputs/selects/textarea `bg-surface`             |
| Border             | card `border border-border`, fields `border border-border`, role-row divider `border-t border-border` |
| Border radius      | card `rounded-2xl`, fields `rounded-md`                              |
| Text — primary     | section heading `text-base font-semibold text-text-primary`, field labels `text-sm font-medium text-text-dark` |
| Text — secondary   | card subhead `text-sm text-text-secondary`                          |
| Spacing            | card `p-6`, section gap `gap-8`, field group `gap-4`, label-to-input `gap-1.5` |
| Hover state        | "+ Add role" `hover:opacity-80` (disabled at 3 roles: `disabled:opacity-40`); Save Profile disabled while saving (`disabled:opacity-60`) |
| Shadow             | standard card shadow (same as ProfileCompletionBanner)               |
| Accent usage       | "Save Profile" button is the **Primary Button** pattern (full width); checkbox `accent-accent`; field focus `focus:border-accent focus:ring-1 focus:ring-accent` |

**Pattern notes:**
First form-heavy page in the project — establishes the canonical **Input/Select/Textarea field** pattern (`rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent`) and the **disabled field** variant (`disabled:bg-surface-secondary disabled:text-text-muted`, used for the read-only Email field and a "currently working" role's End Date). No shadcn/ui or other component-library primitives were introduced — native `<input>`/`<select>`/`<textarea>` styled directly with these classes, consistent with every other page built so far (Hero, Login, Dashboard) which also hand-roll Tailwind classes rather than reaching for a component library. Any future form field anywhere in the app should match this exact class string rather than inventing a variant. Work Experience is a plain array `.map()` (no row-extraction into its own component) since it's only rendered in this one place, capped at 3 roles.

**Feature 06 additions:** the `<form>` now has a real `onSubmit` (calls the `saveProfile` Server Action, fixing the prior native-submit page-reload bug). While saving, the button reads "Saving..." and is disabled.

**Feature 07 addition — Extract from Resume:** a header-row button (`hasResume` prop gates visibility) sits next to the "Profile Information" heading, in a `flex items-start justify-between gap-4` row added around the existing heading block. Button itself reuses the exact **Secondary/outline button** classes (same as Select Resume), reading "Extracting..." and disabled while in flight — same disabled-state convention as Save Profile. Calls `POST /api/resume/extract` directly with `fetch` (this is a Resume Operation per `architecture.md`, API route not Server Action) and merges the result into existing form state field-by-field, never replacing the whole `profile` object.

**Result feedback (superseded the original inline status text from both of the above):** both Save Profile and Extract from Resume now report their result through a single shared `ActionResultDialog` instance (see its own entry above) rather than inline `text-sm`/`text-xs` status lines. One `actionResult: {type, message} | null` state slot drives the one dialog for both buttons — not one dialog instance per button. Any future action button added to this form (or any future page) should follow this same one-dialog-per-component, shared-state pattern rather than reintroducing inline status text or adding a second dialog instance.

### SearchControls

File: `components/find-jobs/SearchControls.tsx`
Last updated: 2026-06-19

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | card `bg-surface`, inputs `bg-surface`, success banner `bg-success-lightest` |
| Border             | card `border border-border`, inputs `border border-border`          |
| Border radius      | card `rounded-2xl`, inputs/button `rounded-md`                      |
| Text — primary     | field labels `text-xs font-medium uppercase text-text-secondary`, banner text `text-success-foreground` |
| Text — secondary   | none                                                                  |
| Spacing            | card `p-6`, fields `gap-4` row, label-to-input `gap-1.5`            |
| Hover state        | Find Jobs button `hover:opacity-90`                                  |
| Shadow             | standard card shadow                                                  |
| Accent usage       | Find Jobs button is the **Primary Button** pattern with a `Search` icon |

**Pattern notes:**
First component with an input that carries a leading icon (`Search` from `lucide-react`, `absolute left-3 top-1/2 -translate-y-1/2 text-text-muted`, input gets `pl-9` instead of the usual `px-3`) — any future icon-prefixed input should match this positioning. Job Title input starts at `"Frontend Engineer"` (now a real controlled `value`, not just a `defaultValue`), Location starts empty with a placeholder only — matches the visual contrast in the design where one field reads as filled and the other as a hint.

**Feature 10 update — wired to the real `/api/agent/find` route:** now a client component (`useState` for `jobTitle`/`location`/`isSearching`/`successMessage`/`error`). The green success banner is conditionally rendered only after a real search succeeds, driven by the route's actual `{jobsFound, strongMatches}` response — no longer the unconditional static markup from Feature 09. Banner icon stays `Sparkles` (`text-success`). **Result feedback is split by outcome, not unified**: success keeps this literal inline banner (matches the design, no popup), but failure routes through the shared `ActionResultDialog` instead of a second banner style — confirmed with the developer as the one deliberate exception to "every action button uses ActionResultDialog for both outcomes," since the design has no error-banner state to match. On success, calls `useRouter().refresh()` so the Server Component page re-queries fresh `jobs` rows without losing this component's own client state. Find Jobs button is `disabled` when Job Title is empty, in addition to the existing `isSearching` disabled state.

### JobFilters

File: `components/find-jobs/JobFilters.tsx`
Last updated: 2026-06-19

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | card `bg-surface`, input/selects `bg-surface`                       |
| Border             | card `border border-border`, input/selects `border border-border`   |
| Border radius      | card `rounded-2xl`, input/selects `rounded-md`                      |
| Text — primary     | input/select text `text-text-primary`                               |
| Text — secondary   | placeholder `placeholder-text-muted`                                |
| Spacing            | card `p-4`, control gap `gap-3`/`gap-4`                              |
| Hover state        | none — inert in this feature                                         |
| Shadow             | standard card shadow                                                  |
| Accent usage       | focus rings only (`focus:ring-1 ring-accent`)                        |

**Pattern notes:**
Text search input reuses the same icon-prefixed input pattern as `SearchControls`. The two `<select>` dropdowns reuse the existing **Form field** shared pattern at native size — no shadcn primitives.

**Feature 11 update — wired to real DB filter/sort/search:** now a client component receiving `query`/`match`/`sort` as props from `app/find-jobs/page.tsx` (which parses `searchParams` server-side). Text input is locally debounced (400ms) before navigating via `router.replace`; the two `<select>`s navigate immediately on `onChange`. Navigation URLs are built with the shared `buildFindJobsUrl()` helper in `lib/find-jobs.ts` rather than `useSearchParams()` — avoids needing a `Suspense` boundary since the resolved values already arrive as props. No visual changes from Feature 09/10; `value`/`onChange` were added to the existing markup only.

### JobsTable

File: `components/find-jobs/JobsTable.tsx`
Last updated: 2026-06-19

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | table card `bg-surface`, header row none, row hover `bg-surface-secondary` |
| Border             | card `border border-border`, row divider `border-b border-border`   |
| Border radius      | card `rounded-2xl` (table itself clipped via `overflow-hidden`)     |
| Text — primary     | row text `text-sm text-text-primary`                                |
| Text — secondary   | column headers `text-xs font-medium uppercase text-text-secondary`, date `text-sm text-text-muted` |
| Spacing            | cell padding `px-6 py-4`, header `px-6 py-3`                        |
| Hover state        | row `hover:bg-surface-secondary` — matches `ui-rules.md`'s Table spec exactly |
| Shadow             | standard card shadow                                                  |
| Accent usage       | none — match score uses range-based color, never accent              |

**Pattern notes:**
Exports the `Job` type — consumed by `app/find-jobs/page.tsx`. Company avatar is a generic `Building2` icon (`lucide-react`, `text-text-muted`) in an `8x8` rounded square, `bg-surface-secondary` — no per-company logo data exists in the schema, so every row gets the same placeholder. **Match score bar/percentage color is range-based, not accent**: above 80% `text-success`/`bg-success`, 70-80% `text-info`/`bg-info`, below 70% `text-warning`/`bg-warning` — originally matched `context/designs/find-jobs.png` exactly (90/80 thresholds), then corrected by the developer to 80/70 (2026-06-20) since the design-derived thresholds felt too strict in practice (see `progress-tracker.md`). Bar track is `bg-border-light`, `h-1 w-16 rounded-full`, fill width set via inline `style` since Tailwind has no arbitrary-percentage-by-prop utility — this is the one acceptable inline-style use case in the project (a computed numeric value, not a static design choice).

**Feature 10 update:** `salary` is now `string | null` (ITPro.lk never returns salary) — renders `"Not specified"` in `text-text-muted` when null. Added an empty state (centered `Building2` icon + muted text, no card content) for when the current user has zero saved jobs, per `ui-rules.md`'s "every section that can be empty must have an empty state" rule — first table-level empty state in the project (distinct from `ResumeUpload`'s empty-dropzone state, which is a default visual, not a conditional branch).

### JobsPagination

File: `components/find-jobs/JobsPagination.tsx`
Last updated: 2026-06-19

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | inactive buttons `bg-surface`, active page `bg-accent`               |
| Border             | inactive buttons `border border-border`, active page none           |
| Border radius      | `rounded-md`                                                          |
| Text — primary     | inactive `text-text-primary`, active `text-accent-foreground`       |
| Text — secondary   | results count `text-sm text-text-secondary`, ellipsis `text-text-muted` |
| Spacing            | button padding `px-3 py-1.5`, row gap `gap-1`                        |
| Hover state        | inactive buttons `hover:bg-surface-secondary`; Previous/Next `disabled:opacity-50` at the first/last page |
| Shadow             | none                                                                  |
| Accent usage       | active page number only — `bg-accent text-accent-foreground`        |

**Pattern notes:**
Page-number row renders up to the first 3 pages (`leadingPageNumbers`, derived from the real `totalPages` prop, not hardcoded), then an ellipsis + final-page button only when `totalPages` exceeds that — **fixed in Feature 10** after the real DB-backed page only had 1 page and exposed that the original implementation hardcoded `[1, 2, 3]` regardless of the `totalPages` prop (Feature 09's mock always passed `totalPages=8`, which masked the bug). `app/find-jobs/page.tsx` only renders this component at all when there's at least one job.

**Feature 11 update — wired to real pagination:** now a client component; Previous/Next/page-number/last-page buttons call `router.push()` (not `replace`, so the back button steps through pages) via the shared `buildFindJobsUrl()` helper, carrying the current `query`/`match`/`sort` props through so paging never drops the active filters. Also fixed a second latent bug found while wiring real clicks: the final-page button (after the ellipsis) never received the active/highlighted style even when it was the current page — only the three `leadingPageNumbers` buttons checked `page === currentPage`. Extracted both buttons' class logic into one shared `pageButtonClasses()` function.

**Feature 12 update — rows are clickable to `/find-jobs/{id}`:** per `project-overview.md`'s "click job row → opens job details page". `scoreColorClasses()` moved out to `lib/utils.ts` (now shared with `JobInfo`/`MatchScore`), no visual change to the existing text/bar usage here. Row click target is a `<Link>` nested inside the existing first `<td>` (not a new sibling `<td>`) with `absolute inset-0`, positioned relative to a `relative` `<tr>` — covers the whole row's click area. **Bug found and fixed this same feature**: the first version added a 6th `<td>` for the overlay instead of nesting inside an existing one — browsers still count an absolutely-positioned `<td>` toward table column layout, which visually shifted every real cell one column to the right (Company column went blank). Nesting inside the existing cell avoids touching column count at all. Any future row-wide click target in a `<table>` in this project should nest inside an existing cell, never add a dedicated overlay cell.

### JobInfo

File: `components/job-details/JobInfo.tsx`
Last updated: 2026-06-20

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | header card + 4 info cards: `bg-surface`                            |
| Border             | `border border-border`                                              |
| Border radius      | `rounded-2xl`                                                         |
| Text — primary     | title `text-xl font-semibold text-text-primary`, info card value `text-sm font-medium text-text-primary` |
| Text — secondary   | company `text-sm text-text-secondary`, info card label `text-xs text-text-muted` |
| Spacing            | header card `p-6`, info cards `p-4`, info card grid `gap-4`         |
| Hover state        | View Job Post button `hover:bg-surface-secondary`                   |
| Shadow             | standard card shadow                                                  |
| Accent usage       | none — Match Score badge uses range-based color via `scoreColorClasses()`, never accent |

**Pattern notes:**
Logo placeholder reuses `JobsTable`'s `Building2`-in-`bg-surface-secondary`-square pattern (no per-company logo data exists). "View Job Post" links to `source_url` (the ITPro.lk listing, opens in new tab) using the **Secondary/outline button** shared pattern with an `ExternalLink` icon. Match Score badge is a pill using `scoreColorClasses()`'s new `badgeBg`/`badgeText` fields — `bg-success-lightest`/`text-success-foreground` (above 80%), `bg-info-lightest`/`text-info-foreground` (70-80%), `bg-warning/10`/`text-warning` (below 70%, opacity-modifier since no `--color-warning-light` token exists, matching the login page's `bg-error/10` precedent). The 4 info cards (Salary Est./Location/Job Type/Date Found) are a `.map()` over an array, each a muted-icon-in-square (same convention as the logo placeholder) + bold value + muted label; null `salary`/`location`/`job_type` render as `"—"`.

### MatchScore

File: `components/job-details/MatchScore.tsx`
Last updated: 2026-06-20

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | `bg-surface`                                                         |
| Border             | `border border-border`                                              |
| Border radius      | `rounded-2xl`                                                         |
| Text — primary     | heading `text-base font-semibold text-text-primary`                 |
| Text — secondary   | reasoning paragraph `text-sm text-text-secondary`, "You have"/"Gap skills" labels `text-xs font-medium uppercase text-text-secondary` |
| Spacing            | `p-6`, skills section gap `gap-4`, badge row `gap-2`                |
| Hover state        | none — not interactive                                                |
| Shadow             | standard card shadow                                                  |
| Accent usage       | none                                                                  |

**Pattern notes:**
Renders two cards (AI Match Reasoning, Required Skills vs Your Profile) from one component — matches `architecture.md`'s single-file listing for this section. Matched-skill badges: `bg-success-lightest text-success-foreground` with a `Check` icon — matches `ui-tokens.md`'s existing "Matched skill" entry exactly. Missing-skill badges: `bg-warning/10 text-warning` with an `X` icon — **deliberately does not match** `ui-tokens.md`'s old "Missing skill" entry (`bg-accent-muted text-accent`), which was stale and never actually matched `job-details.png` (the design uses the same orange as the Match Score Bar's lowest tier). Corrected in `ui-tokens.md` to follow the design as source of truth. Both badge groups render a muted fallback line ("No matched skills found."/"No skill gaps found.") instead of an empty row when their array is empty.

### JobDescription

File: `components/job-details/JobDescription.tsx`
Last updated: 2026-06-20

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | `bg-surface`                                                         |
| Border             | `border border-border`                                              |
| Border radius      | `rounded-2xl`                                                         |
| Text — primary     | heading `text-base font-semibold`, sub-heading `text-sm font-semibold` |
| Text — secondary   | body/bullet text `text-sm text-text-secondary`                      |
| Spacing            | `p-6`, section gap `gap-5`, bullet list gap `gap-1.5`               |
| Hover state        | none — not interactive                                                |
| Shadow             | standard card shadow                                                  |
| Accent usage       | none                                                                  |

**Pattern notes:**
Currently only `about_role` ever has data (the only field `agent/itpro.ts` populates — `responsibilities`/`requirements`/`nice_to_have`/`benefits`/`about_company` are real DB columns but always empty until `agent/extractor.ts` is built, which is not part of Feature 12's scope). A private (non-exported) `BulletSection` helper inside the same file renders `null` when its `items` array is empty, so the structured sections are already forward-compatible with zero extra work once that data exists. Bullet marker is a small `bg-text-muted` dot (`h-1 w-1 rounded-full`), not a native `<ul>` disc — first use of this bullet style in the project.

### CompanyResearch

File: `components/job-details/CompanyResearch.tsx`
Last updated: 2026-06-20

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | `bg-surface`                                                         |
| Border             | `border border-border`                                              |
| Border radius      | `rounded-2xl`                                                         |
| Text — primary     | heading `text-base font-semibold`, section labels `text-xs font-medium uppercase text-text-secondary`, "No research yet" `text-sm font-medium text-text-primary` |
| Text — secondary   | body/bullets `text-sm text-text-secondary`, empty-state body `text-sm text-text-muted`, sources `text-xs text-text-muted` |
| Spacing            | `p-6`, empty state `py-10`, populated state sections `gap-5`        |
| Hover state        | Research/Research Again button `hover:opacity-90`, disabled while researching |
| Shadow             | standard card shadow                                                  |
| Accent usage       | Research Company button is the **Primary Button** pattern; `techStack` tags use `bg-accent/10 text-accent` |

**Pattern notes:**
Now a client component (Feature 13) — `jobId`/`company`/`initialDossier` props, `dossier`/`isResearching`/`error` state. Same fetch + `ActionResultDialog`-for-errors + button-label-swap (`"Researching..." : "Research Company"`/`"Research Again"`) pattern as `SearchControls.tsx`. Renders all 9 dossier fields once populated per `build-plan.md`'s Company Research Card spec: `companyOverview`/`whyThisRole` as prose, `techStack` as tag badges (reusing `MatchScore.tsx`'s pill shape), `culture`/`yourEdge`/`gapsToAddress`/`smartQuestions`/`interviewPrep` as bullet lists (same muted-dot bullet style as `JobDescription`'s `BulletSection`), `sources` as plain muted text — never links, since the synthesis prompt doesn't guarantee `sources` are real URLs. Empty state markup unchanged from Feature 12, still follows `ui-rules.md`'s Empty States rule exactly.

### JobActions

File: `components/job-details/JobActions.tsx`
Last updated: 2026-06-20

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | `bg-accent`                                                          |
| Border             | none                                                                  |
| Border radius      | `rounded-md`                                                          |
| Text — primary     | `text-accent-foreground`, `text-sm font-medium`                     |
| Text — secondary   | none                                                                  |
| Spacing            | `px-4 py-3`, full width                                               |
| Hover state        | `hover:opacity-90`                                                    |
| Shadow             | none                                                                  |
| Accent usage       | full **Primary Button** pattern, stretched to `w-full`              |

**Pattern notes:**
Single full-width link styled as the Primary Button, opens `external_apply_url` in a new tab. Label is dynamic — "Apply Now at {company}" — not static copy.

---

## Shared Patterns

- **Dark CTA button**: `bg-text-slate text-white` — used for every primary "Get Started" / "Start for free" button on the marketing pages (design uses a dark navy, not the purple accent, for these).
- **Secondary/outline button**: `rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary` — used identically by Hero/CTASection's secondary CTA, LoginPage's provider buttons (with `flex w-full items-center justify-center gap-2` added for icon + label), and DashboardPage's sign out button. Match these exact classes for any future plain bordered button rather than inventing a new variant.
- **`.gradient-hero`**: CSS utility class in `app/globals.css` — soft pastel radial-gradient blend of `--color-accent-light` / `--color-info-light` / `--color-accent-muted` over `--color-surface`. Used by Hero and CTASection so the gradient definition isn't duplicated across components.
- **Primary button**: `rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90` — used by ResumeUpload's "Generate Resume from Profile" and ProfileForm's "Save Profile". First use of the purple accent on a button (marketing pages use the dark `bg-text-slate` CTA instead). Match these exact classes for any future primary/destructive-confirm action button.
- **Pill badge**: `rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent` — used by ProfileCompletionBanner's missing-field tags and TagInput's chips. Any future tag/badge in this same "soft accent" style should match these classes rather than inventing a new pill variant.
- **Form field (input/select/textarea)**: `rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent` — established by ProfileForm, the first form-heavy page. Disabled variant adds `disabled:bg-surface-secondary disabled:text-text-muted`. No shadcn/ui primitives in use — every field is a native element styled directly with this class string.
- **Inline status/error text**: `text-error` for failures, `text-success` for success — `text-xs text-error` for a field-level/passive validation error directly under an input (ResumeUpload's drag-and-drop file validation). First introduced in Feature 06. **As of Feature 07, this is scoped to passive field/upload validation only** — discrete action-button results (a button the user clicked, succeeded or failed) now go through `ActionResultDialog` (see Components above) instead. Don't use inline status text for a new action button; use the dialog.
- **Action button result popup**: `ActionResultDialog` (`components/shared/ActionResultDialog.tsx`) — the standard way to report the result of any action-trigger button (Save Profile, Extract from Resume, Generate Resume from Profile). Native `<dialog>`-based, centered, themed card with a `CheckCircle`/`AlertCircle` icon and a message. Success auto-dismisses after 2.5s; error stays open until manually closed. One dialog instance + one shared result state per consuming component, reused across that component's action buttons — never one dialog per button, never inline status text for this case.
