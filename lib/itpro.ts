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
