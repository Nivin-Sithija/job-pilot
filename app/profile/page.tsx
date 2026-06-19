import { redirect } from "next/navigation";

import { createInsforgeServer } from "@/lib/insforge-server";
import { calculateProfileCompletion, EMPTY_PROFILE, rowToProfile, type ProfileRow } from "@/lib/profile";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { ProfileCompletionBanner } from "@/components/profile/ProfileCompletionBanner";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data.user) {
    redirect("/login");
  }

  const { data: row } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  // insforge.database.from() returns an untyped row — cast is safe since we selected "*" against the known schema
  const profileRow = row as (ProfileRow & { resume_pdf_key: string | null }) | null;
  const initialProfile = profileRow ? rowToProfile(profileRow) : EMPTY_PROFILE;
  const completion = calculateProfileCompletion(initialProfile);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar active="Profile" />
      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-8 py-8">
        <ProfileCompletionBanner
          percentage={completion.percentage}
          missingFields={completion.missingFields}
        />
        <ResumeUpload initialFileName={profileRow?.resume_pdf_key ? "resume.pdf" : null} />
        <ProfileForm
          initialEmail={data.user.email ?? ""}
          initialProfile={initialProfile}
          hasResume={!!profileRow?.resume_pdf_key}
        />
      </main>
    </div>
  );
}
