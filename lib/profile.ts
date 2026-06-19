import { z } from "zod";

export const workExperienceEntrySchema = z.object({
  company: z.string(),
  jobTitle: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  currentlyWorking: z.boolean(),
  responsibilities: z.string(),
});
export type WorkExperienceEntry = z.infer<typeof workExperienceEntrySchema>;

export const educationInfoSchema = z.object({
  highestDegree: z.string(),
  fieldOfStudy: z.string(),
  institutionName: z.string(),
  graduationYear: z.string(),
});
export type EducationInfo = z.infer<typeof educationInfoSchema>;

export const profileSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedinUrl: z.string(),
  portfolioUrl: z.string(),
  workAuthorization: z.string(),
  currentTitle: z.string(),
  experienceLevel: z.string(),
  yearsExperience: z.string(),
  skills: z.array(z.string()),
  industries: z.array(z.string()),
  workExperience: z.array(workExperienceEntrySchema).max(3),
  education: educationInfoSchema,
  jobTitlesSeeking: z.string(),
  remotePreference: z.string(),
  salaryExpectation: z.string(),
  preferredLocations: z.string(),
  coverLetterTone: z.string(),
});
export type Profile = z.infer<typeof profileSchema>;

export const EMPTY_PROFILE: Profile = {
  fullName: "",
  phone: "",
  location: "",
  linkedinUrl: "",
  portfolioUrl: "",
  workAuthorization: "",
  currentTitle: "",
  experienceLevel: "",
  yearsExperience: "",
  skills: [],
  industries: [],
  workExperience: [],
  education: {
    highestDegree: "",
    fieldOfStudy: "",
    institutionName: "",
    graduationYear: "",
  },
  jobTitlesSeeking: "",
  remotePreference: "",
  salaryExpectation: "",
  preferredLocations: "",
  coverLetterTone: "",
};

export type ProfileRow = {
  full_name: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: string | null;
  current_title: string | null;
  experience_level: string | null;
  years_experience: number | null;
  skills: string[] | null;
  industries: string[] | null;
  work_experience: WorkExperienceEntry[] | null;
  education: EducationInfo | null;
  job_titles_seeking: string[] | null;
  remote_preference: string | null;
  salary_expectation: string | null;
  preferred_locations: string[] | null;
  cover_letter_tone: string | null;
};

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function joinCommaList(values: string[] | null): string {
  return (values ?? []).join(", ");
}

export function rowToProfile(row: ProfileRow): Profile {
  return {
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    location: row.location ?? "",
    linkedinUrl: row.linkedin_url ?? "",
    portfolioUrl: row.portfolio_url ?? "",
    workAuthorization: row.work_authorization ?? "",
    currentTitle: row.current_title ?? "",
    experienceLevel: row.experience_level ?? "",
    yearsExperience: row.years_experience != null ? String(row.years_experience) : "",
    skills: row.skills ?? [],
    industries: row.industries ?? [],
    workExperience: row.work_experience ?? [],
    education: row.education ?? EMPTY_PROFILE.education,
    jobTitlesSeeking: joinCommaList(row.job_titles_seeking),
    remotePreference: row.remote_preference ?? "",
    salaryExpectation: row.salary_expectation ?? "",
    preferredLocations: joinCommaList(row.preferred_locations),
    coverLetterTone: row.cover_letter_tone ?? "",
  };
}

export function profileToRow(profile: Profile): ProfileRow {
  return {
    full_name: profile.fullName,
    phone: profile.phone,
    location: profile.location,
    linkedin_url: profile.linkedinUrl,
    portfolio_url: profile.portfolioUrl,
    work_authorization: profile.workAuthorization,
    current_title: profile.currentTitle,
    experience_level: profile.experienceLevel,
    years_experience: profile.yearsExperience.trim() === "" ? null : Number(profile.yearsExperience),
    skills: profile.skills,
    industries: profile.industries,
    work_experience: profile.workExperience,
    education: profile.education,
    job_titles_seeking: splitCommaList(profile.jobTitlesSeeking),
    remote_preference: profile.remotePreference,
    salary_expectation: profile.salaryExpectation,
    preferred_locations: splitCommaList(profile.preferredLocations),
    cover_letter_tone: profile.coverLetterTone,
  };
}

const REQUIRED_GROUPS: { key: string; label: string; check: (p: Profile) => boolean }[] = [
  { key: "fullName", label: "FULL NAME", check: (p) => p.fullName.trim().length > 0 },
  { key: "phone", label: "PHONE", check: (p) => p.phone.trim().length > 0 },
  { key: "location", label: "LOCATION", check: (p) => p.location.trim().length > 0 },
  {
    key: "professionalLinks",
    label: "LINKEDIN OR PORTFOLIO",
    check: (p) => p.linkedinUrl.trim().length > 0 || p.portfolioUrl.trim().length > 0,
  },
  {
    key: "workAuthorization",
    label: "WORK AUTHORIZATION",
    check: (p) => p.workAuthorization.trim().length > 0,
  },
  {
    key: "professionalInfo",
    label: "PROFESSIONAL INFO",
    check: (p) =>
      p.currentTitle.trim().length > 0 &&
      p.experienceLevel.trim().length > 0 &&
      p.yearsExperience.trim().length > 0,
  },
  { key: "skills", label: "SKILLS", check: (p) => p.skills.length > 0 },
  {
    key: "workExperience",
    label: "WORK EXPERIENCE",
    check: (p) => p.workExperience.length > 0 && p.workExperience[0].company.trim().length > 0,
  },
  {
    key: "education",
    label: "EDUCATION",
    check: (p) =>
      p.education.highestDegree.trim().length > 0 &&
      p.education.fieldOfStudy.trim().length > 0 &&
      p.education.institutionName.trim().length > 0 &&
      p.education.graduationYear.trim().length > 0,
  },
  {
    key: "jobPreferences",
    label: "JOB PREFERENCES",
    check: (p) => p.jobTitlesSeeking.trim().length > 0 && p.remotePreference.trim().length > 0,
  },
];

export function calculateProfileCompletion(profile: Profile): {
  percentage: number;
  missingFields: { key: string; label: string }[];
  isComplete: boolean;
} {
  const missingFields = REQUIRED_GROUPS.filter((group) => !group.check(profile)).map(
    ({ key, label }) => ({ key, label }),
  );
  const percentage = Math.round(
    ((REQUIRED_GROUPS.length - missingFields.length) / REQUIRED_GROUPS.length) * 100,
  );
  return { percentage, missingFields, isComplete: missingFields.length === 0 };
}
