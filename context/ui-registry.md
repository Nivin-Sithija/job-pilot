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

### DashboardPage (placeholder)

`app/dashboard/page.tsx`

Minimal placeholder for Feature 02 so the auth flow is end-to-end testable — will be fully replaced by Feature 14's real dashboard UI. As of Feature 06, wrapped with `AppNavbar` (`active="Dashboard"`) so it's navigable to/from Profile during manual testing; the centered content below the navbar is otherwise unchanged.

- Page wrapper: `min-h-screen bg-background`, with `<AppNavbar active="Dashboard" />` then `<main className="flex flex-col items-center justify-center gap-4 px-6 py-24">`
- Label text: `text-sm text-text-secondary` (e.g. "Signed in as")
- Value text: `text-lg font-semibold text-text-primary` (e.g. the user's email)
- Sign out button: extracted to `components/dashboard/SignOutButton.tsx` (client component — calls `posthog.reset()` on click, then submits `signOutAction`). Same classes as the shared **Secondary Button** pattern below.

### SignOutButton

File: `components/dashboard/SignOutButton.tsx`
Last updated: 2026-06-18

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
Extracted from the inline button that used to live in `app/dashboard/page.tsx` so it could become a client component (needs `onClick` to call `posthog.reset()` before the form submits to `signOutAction`). Classes are unchanged — this is a 1:1 match of the existing **Secondary/outline button** shared pattern below, not a new variant. Any future plain bordered button should keep matching that shared pattern, not this entry specifically.

### AppNavbar

File: `components/layout/AppNavbar.tsx`
Last updated: 2026-06-18 (now also used by `app/dashboard/page.tsx`)

| Property         | Class                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Background        | `bg-surface`                                                         |
| Border             | `border-b border-border`                                            |
| Border radius      | none                                                                  |
| Text — primary     | active link: `text-accent`                                          |
| Text — secondary   | inactive link: `text-text-dark`, hover: `hover:text-text-primary`   |
| Spacing            | wrapper `mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6`, nav links `gap-8` |
| Hover state        | inactive links only — `hover:text-text-primary`                     |
| Shadow             | none                                                                  |
| Accent usage       | `text-accent` on the active nav item only, no underline             |

**Pattern notes:**
App-shell navbar (Dashboard / Find Jobs / Profile) — distinct from the marketing `Navbar.tsx` (logo + CTA, no active-state links). Shares the same wrapper/logo classes as the marketing navbar but adds an `active` prop (`"Dashboard" | "Find Jobs" | "Profile"`) that swaps a link to `text-accent`. No CTA button — app pages don't need one. Built for Feature 05 (Profile); added to the Dashboard placeholder during Feature 06 (at the developer's request, to unblock manual testing — Dashboard's real UI is still Feature 14's). Feature 09 (Find Jobs) should reuse this component too rather than building its own navbar.

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
Text search input reuses the same icon-prefixed input pattern as `SearchControls`. The two `<select>` dropdowns reuse the existing **Form field** shared pattern at native size — no shadcn primitives. All three controls are purely decorative for Feature 09 (no `onChange`, plain Server Component) — Feature 11 wires them to real filter/sort/search logic against DB data.

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
Exports the `Job` type — consumed by `app/find-jobs/page.tsx`. Company avatar is a generic `Building2` icon (`lucide-react`, `text-text-muted`) in an `8x8` rounded square, `bg-surface-secondary` — no per-company logo data exists in the schema, so every row gets the same placeholder. **Match score bar/percentage color is range-based, not accent**: ≥90% `text-success`/`bg-success`, 80-89% `text-info`/`bg-info`, below 80% `text-warning`/`bg-warning` — corrected from two previously-conflicting tables in `ui-tokens.md`/`ui-rules.md` to match `context/designs/find-jobs.png` exactly (see `progress-tracker.md`). Bar track is `bg-border-light`, `h-1 w-16 rounded-full`, fill width set via inline `style` since Tailwind has no arbitrary-percentage-by-prop utility — this is the one acceptable inline-style use case in the project (a computed numeric value, not a static design choice).

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
Fully static — `currentPage`/`totalPages`/`from`/`to`/`total` are passed in as props, but no button has an `onClick`. Feature 11 will wire real pagination state against DB query results. Page-number row renders up to the first 3 pages (`leadingPageNumbers`, derived from the real `totalPages` prop, not hardcoded), then an ellipsis + final-page button only when `totalPages` exceeds that — **fixed in Feature 10** after the real DB-backed page only had 1 page and exposed that the original implementation hardcoded `[1, 2, 3]` regardless of the `totalPages` prop (Feature 09's mock always passed `totalPages=8`, which masked the bug). `app/find-jobs/page.tsx` only renders this component at all when there's at least one job.

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
