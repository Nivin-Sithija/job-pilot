export type ITProJob = {
  id: string;
  title: string;
  description: string;
  summary: string;
  type_id: string;
  category_id: string;
  location: string | null;
  company: string;
  website: string | null;
  views_count: string;
  created_on: string;
};

export async function fetchRecentJobs(limit = 100): Promise<ITProJob[]> {
  const response = await fetch(`https://itpro.lk/api/v1/jobs?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`ITPro.lk API error: ${response.status}`);
  }

  return response.json();
}

// The API ignores page/q/keyword/search/title params — always returns the same
// recent-jobs feed, so search happens here instead of server-side.
export function filterJobs(jobs: ITProJob[], jobTitle: string, location: string): ITProJob[] {
  const titleNeedle = jobTitle.toLowerCase();
  return jobs.filter((job) => {
    const haystack = `${job.title} ${job.description}`.toLowerCase();
    if (!haystack.includes(titleNeedle)) return false;
    if (location && !haystack.includes(location.toLowerCase())) return false;
    return true;
  });
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// `location`/`category_id`/`type_id` are opaque numeric ids with no public lookup, but every
// `summary` reliably embeds both as plain text: "Join {company} as a {title} in {location},
// {jobType}. Apply now on ITPro.lk. ...". Parsed from the end backwards (last comma, last " in ")
// so a title containing "in" or a comma doesn't get mistaken for the location.
export function parseLocationAndJobType(summary: string): {
  location: string | null;
  jobType: string | null;
} {
  const match = summary.match(/^(.*),\s*([^.]+)\.\s*Apply now on ITPro\.lk\./);
  if (!match) return { location: null, jobType: null };

  const [, beforeComma, jobType] = match;
  const inIndex = beforeComma.lastIndexOf(" in ");
  if (inIndex === -1) return { location: null, jobType: jobType.trim() };

  return { location: beforeComma.slice(inIndex + 4).trim(), jobType: jobType.trim() };
}

// Real ITPro.lk job detail URL — verified `/jobs/{id}` (no slug) 302s to ITPro's own
// page-unavailable route. `/job/{id}/` (singular, trailing slash) 301-redirects to the
// correct slugged listing, so it works without us having to compute the slug ourselves.
export function buildJobUrl(id: string): string {
  return `https://itpro.lk/job/${id}/`;
}

// `website` from the ITPro.lk API is usually the company's real homepage but sometimes
// points at a careers subpage — strip back to the root origin either way. Falls back to a
// guessed domain when `website` is blank (true for roughly a third of listings).
export function deriveHomepageUrl(website: string | null, company: string): string {
  if (website) {
    try {
      const withProtocol = /^https?:\/\//i.test(website) ? website : `https://${website}`;
      return new URL(withProtocol).origin;
    } catch {
      // fall through to the guessed-domain fallback below
    }
  }

  const slug = company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  return `https://www.${slug}.com`;
}
