"use server";

import { revalidatePath } from "next/cache";

import { createInsforgeServer } from "@/lib/insforge-server";
import { getPostHogClient } from "@/lib/posthog-server";
import { calculateProfileCompletion, profileSchema, profileToRow, type Profile } from "@/lib/profile";

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

export async function saveProfile(profile: Profile): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      return { success: false, error: "Some profile fields are invalid." };
    }

    const insforge = await createInsforgeServer();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData.user;
    if (!user) {
      return { success: false, error: "You must be signed in to save your profile." };
    }

    const { data: existing } = await insforge.database
      .from("profiles")
      .select("is_complete")
      .eq("id", user.id)
      .maybeSingle();

    const { isComplete } = calculateProfileCompletion(parsed.data);
    const row = profileToRow(parsed.data);

    const { error } = await insforge.database.from("profiles").upsert(
      { id: user.id, email: user.email, ...row, is_complete: isComplete },
      { onConflict: "id" },
    );

    if (error) {
      console.error("[actions/profile]", error);
      return { success: false, error: "Failed to save profile." };
    }

    // insforge.database.from() returns an untyped row — cast is safe since we selected exactly this column
    const wasComplete = (existing as { is_complete: boolean } | null)?.is_complete ?? false;
    if (isComplete && !wasComplete) {
      getPostHogClient().capture({
        distinctId: user.id,
        event: "profile_completed",
      });
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[actions/profile]", error);
    return { success: false, error: "Failed to save profile." };
  }
}

export async function uploadResume(
  formData: FormData,
): Promise<{ success: boolean; error?: string; url?: string; fileName?: string }> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false, error: "No file was provided." };
    }
    if (file.type !== "application/pdf") {
      return { success: false, error: "Only PDF files are supported." };
    }
    if (file.size > MAX_RESUME_SIZE_BYTES) {
      return { success: false, error: "File is too large. Maximum size is 5MB." };
    }

    const insforge = await createInsforgeServer();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData.user;
    if (!user) {
      return { success: false, error: "You must be signed in to upload a resume." };
    }

    const { data: existing } = await insforge.database
      .from("profiles")
      .select("resume_pdf_key")
      .eq("id", user.id)
      .maybeSingle();

    // insforge.database.from() returns an untyped row — cast is safe since we selected exactly this column
    const previousKey = (existing as { resume_pdf_key: string | null } | null)?.resume_pdf_key;
    if (previousKey) {
      await insforge.storage.from("resumes").remove(previousKey);
    }

    const { data: uploaded, error: uploadError } = await insforge.storage
      .from("resumes")
      .upload(`${user.id}/resume.pdf`, file);

    if (uploadError || !uploaded) {
      console.error("[actions/profile]", uploadError);
      return { success: false, error: "Failed to upload resume." };
    }

    const { error: dbError } = await insforge.database.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        resume_pdf_url: uploaded.url,
        resume_pdf_key: uploaded.key,
      },
      { onConflict: "id" },
    );

    if (dbError) {
      console.error("[actions/profile]", dbError);
      return { success: false, error: "Resume uploaded but failed to save to your profile." };
    }

    revalidatePath("/profile");
    return { success: true, url: uploaded.url, fileName: file.name };
  } catch (error) {
    console.error("[actions/profile]", error);
    return { success: false, error: "Failed to upload resume." };
  }
}
