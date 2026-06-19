"use client";

import { useState, type FormEvent } from "react";

import { saveProfile } from "@/actions/profile";
import { ActionResultDialog } from "@/components/shared/ActionResultDialog";
import { TagInput } from "@/components/profile/TagInput";
import { type Profile, type WorkExperienceEntry } from "@/lib/profile";
import { type ExtractedProfileFields } from "@/lib/resume";

type ProfileFormProps = {
  initialEmail: string;
  initialProfile: Profile;
  hasResume: boolean;
};

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const LABEL_CLASS = "text-sm font-medium text-text-dark";
const SECTION_HEADING_CLASS = "text-base font-semibold text-text-primary";

function emptyRole(): WorkExperienceEntry {
  return {
    company: "",
    jobTitle: "",
    startDate: "",
    endDate: "",
    currentlyWorking: false,
    responsibilities: "",
  };
}

function isRoleBlank(role: WorkExperienceEntry): boolean {
  return (
    role.company.trim().length === 0 &&
    role.jobTitle.trim().length === 0 &&
    role.responsibilities.trim().length === 0
  );
}

function mergeExtractedProfile(current: Profile, extracted: ExtractedProfileFields): Profile {
  const merged = { ...current };
  for (const key of Object.keys(extracted) as (keyof ExtractedProfileFields)[]) {
    const value = extracted[key];
    const isEmpty =
      (typeof value === "string" && value.trim().length === 0) ||
      (Array.isArray(value) && value.length === 0) ||
      // value's real type is narrowed by the key === "workExperience" check above the cast,
      // but the loop variable's type stays the ExtractedProfileFields union either way
      (key === "workExperience" && (value as WorkExperienceEntry[]).every(isRoleBlank)) ||
      // same narrowing situation as workExperience above — education's fields are all strings
      (key === "education" &&
        Object.values(value as Record<string, string>).every((v) => v.trim().length === 0));
    if (!isEmpty) {
      // extracted[key]'s type matches Profile[key] exactly for every key in ExtractedProfileFields,
      // since extractedProfileSchema is profileSchema.pick({...}) — narrowed by the loop over its own keys
      merged[key] = value as never;
    }
  }
  return merged;
}

export function ProfileForm({ initialEmail, initialProfile, hasResume }: ProfileFormProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [actionResult, setActionResult] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsSaving(true);
    const result = await saveProfile(profile);
    setIsSaving(false);
    setActionResult(
      result.success
        ? { type: "success", message: "Profile saved." }
        : { type: "error", message: result.error ?? "Failed to save profile." },
    );
  }

  async function handleExtract(): Promise<void> {
    setIsExtracting(true);
    try {
      const response = await fetch("/api/resume/extract", { method: "POST" });
      const result: { success: boolean; data?: ExtractedProfileFields; error?: string } =
        await response.json();
      if (result.success && result.data) {
        setProfile((prev) => mergeExtractedProfile(prev, result.data!));
        setActionResult({
          type: "success",
          message: "Profile fields updated from your resume. Review before saving.",
        });
      } else {
        setActionResult({
          type: "error",
          message: result.error ?? "Could not extract profile information from this resume.",
        });
      }
    } catch {
      setActionResult({
        type: "error",
        message: "Could not extract profile information from this resume.",
      });
    } finally {
      setIsExtracting(false);
    }
  }

  function updateField<K extends keyof Profile>(key: K, value: Profile[K]): void {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function updateRole(index: number, patch: Partial<WorkExperienceEntry>): void {
    setProfile((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((role, i) =>
        i === index ? { ...role, ...patch } : role,
      ),
    }));
  }

  function addRole(): void {
    if (profile.workExperience.length >= 3) return;
    setProfile((prev) => ({ ...prev, workExperience: [...prev.workExperience, emptyRole()] }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-8 rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={SECTION_HEADING_CLASS}>Profile Information</h2>
          <p className="mt-1 text-sm text-text-secondary">
            This content is used to accurately represent you in agent interactions.
          </p>
        </div>
        {hasResume && (
          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              disabled={isExtracting}
              onClick={() => void handleExtract()}
              className="shrink-0 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary disabled:opacity-60"
            >
              {isExtracting ? "Extracting..." : "Extract from Resume"}
            </button>
          </div>
        )}
      </div>

      {/* Personal Info */}
      <div className="flex flex-col gap-4">
        <h3 className={SECTION_HEADING_CLASS}>Personal Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Full Name</label>
            <input
              className={INPUT_CLASS}
              value={profile.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Email</label>
            <input className={INPUT_CLASS} value={initialEmail} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Phone Number</label>
            <input
              className={INPUT_CLASS}
              placeholder="+1 (000) 000-0000"
              value={profile.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Location</label>
            <input
              className={INPUT_CLASS}
              placeholder="City, Country"
              value={profile.location}
              onChange={(e) => updateField("location", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>LinkedIn URL</label>
            <input
              className={INPUT_CLASS}
              value={profile.linkedinUrl}
              onChange={(e) => updateField("linkedinUrl", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Portfolio/GitHub</label>
            <input
              className={INPUT_CLASS}
              value={profile.portfolioUrl}
              onChange={(e) => updateField("portfolioUrl", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Work Authorization</label>
            <select
              className={INPUT_CLASS}
              value={profile.workAuthorization}
              onChange={(e) => updateField("workAuthorization", e.target.value)}
            >
              <option value="citizen">Citizen</option>
              <option value="permanent_resident">Permanent Resident</option>
              <option value="visa_required">Visa Required</option>
            </select>
          </div>
        </div>
      </div>

      {/* Professional Info */}
      <div className="flex flex-col gap-4">
        <h3 className={SECTION_HEADING_CLASS}>Professional Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Current/Recent Job Title</label>
            <input
              className={INPUT_CLASS}
              value={profile.currentTitle}
              onChange={(e) => updateField("currentTitle", e.target.value)}
            />
          </div>
          <div />
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Experience Level</label>
            <select
              className={INPUT_CLASS}
              value={profile.experienceLevel}
              onChange={(e) => updateField("experienceLevel", e.target.value)}
            >
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Years of Experience</label>
            <input
              type="number"
              className={INPUT_CLASS}
              value={profile.yearsExperience}
              onChange={(e) => updateField("yearsExperience", e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>Skills</label>
          <TagInput
            placeholder="Add a skill"
            tags={profile.skills}
            onChange={(skills) => updateField("skills", skills)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>Industries Worked In (Optional)</label>
          <TagInput
            placeholder="e.g. FinTech, Healthcare"
            tags={profile.industries}
            onChange={(industries) => updateField("industries", industries)}
          />
        </div>
      </div>

      {/* Work Experience */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className={SECTION_HEADING_CLASS}>Work Experience</h3>
          <button
            type="button"
            onClick={addRole}
            disabled={profile.workExperience.length >= 3}
            className="text-sm font-medium text-accent hover:opacity-80 disabled:opacity-40"
          >
            + Add role
          </button>
        </div>
        {profile.workExperience.map((role, index) => (
          <div key={index} className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Company Name</label>
              <input
                className={INPUT_CLASS}
                value={role.company}
                onChange={(e) => updateRole(index, { company: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Job Title</label>
              <input
                className={INPUT_CLASS}
                value={role.jobTitle}
                onChange={(e) => updateRole(index, { jobTitle: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Start Date</label>
              <input
                type="month"
                className={INPUT_CLASS}
                value={role.startDate}
                onChange={(e) => updateRole(index, { startDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className={LABEL_CLASS}>End Date</label>
                <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <input
                    type="checkbox"
                    checked={role.currentlyWorking}
                    onChange={(e) =>
                      updateRole(index, {
                        currentlyWorking: e.target.checked,
                        endDate: e.target.checked ? "" : role.endDate,
                      })
                    }
                    className="accent-accent"
                  />
                  Currently working here
                </label>
              </div>
              <input
                type="month"
                disabled={role.currentlyWorking}
                className={`${INPUT_CLASS} disabled:bg-surface-secondary disabled:text-text-muted`}
                value={role.endDate}
                onChange={(e) => updateRole(index, { endDate: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Key Responsibilities</label>
              <textarea
                rows={3}
                className={INPUT_CLASS}
                value={role.responsibilities}
                onChange={(e) => updateRole(index, { responsibilities: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className="flex flex-col gap-4">
        <h3 className={SECTION_HEADING_CLASS}>Education</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Highest Degree</label>
            <select
              className={INPUT_CLASS}
              value={profile.education.highestDegree}
              onChange={(e) =>
                updateField("education", { ...profile.education, highestDegree: e.target.value })
              }
            >
              <option value="high_school">High School</option>
              <option value="associates">Associate&apos;s</option>
              <option value="bachelors">Bachelor&apos;s</option>
              <option value="masters">Master&apos;s</option>
              <option value="phd">PhD</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Field of Study</label>
            <input
              className={INPUT_CLASS}
              value={profile.education.fieldOfStudy}
              onChange={(e) =>
                updateField("education", { ...profile.education, fieldOfStudy: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Institution Name</label>
            <input
              className={INPUT_CLASS}
              placeholder="e.g. State University"
              value={profile.education.institutionName}
              onChange={(e) =>
                updateField("education", {
                  ...profile.education,
                  institutionName: e.target.value,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Graduation Year</label>
            <input
              className={INPUT_CLASS}
              placeholder="YYYY"
              value={profile.education.graduationYear}
              onChange={(e) =>
                updateField("education", {
                  ...profile.education,
                  graduationYear: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Job Preferences */}
      <div className="flex flex-col gap-4">
        <h3 className={SECTION_HEADING_CLASS}>Job Preferences</h3>
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>Job Titles Seeking</label>
          <input
            className={INPUT_CLASS}
            value={profile.jobTitlesSeeking}
            onChange={(e) => updateField("jobTitlesSeeking", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Remote Preference</label>
            <select
              className={INPUT_CLASS}
              value={profile.remotePreference}
              onChange={(e) => updateField("remotePreference", e.target.value)}
            >
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
              <option value="any">Any</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Salary Expectation (Optional)</label>
            <input
              className={INPUT_CLASS}
              placeholder="e.g. $120k+"
              value={profile.salaryExpectation}
              onChange={(e) => updateField("salaryExpectation", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Preferred Locations (Optional)</label>
            <input
              className={INPUT_CLASS}
              placeholder="e.g. New York, London"
              value={profile.preferredLocations}
              onChange={(e) => updateField("preferredLocations", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Cover Letter Tone</label>
            <select
              className={INPUT_CLASS}
              value={profile.coverLetterTone}
              onChange={(e) => updateField("coverLetterTone", e.target.value)}
            >
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="enthusiastic">Enthusiastic</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save Profile"}
      </button>

      <ActionResultDialog
        open={actionResult !== null}
        type={actionResult?.type ?? "success"}
        message={actionResult?.message ?? ""}
        onClose={() => setActionResult(null)}
      />
    </form>
  );
}
