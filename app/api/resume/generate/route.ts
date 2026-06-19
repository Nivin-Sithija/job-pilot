import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { createElement, type ReactElement } from "react";

import { createInsforgeServer } from "@/lib/insforge-server";
import { EMPTY_PROFILE, rowToProfile, type ProfileRow } from "@/lib/profile";
import { generateResumeContent } from "@/lib/resume";
import { ResumePDF } from "@/lib/resume-pdf";

export async function POST(): Promise<
  NextResponse<{ success: boolean; fileName?: string; error?: string }>
> {
  try {
    const insforge = await createInsforgeServer();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData.user;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in to generate a resume." },
        { status: 401 },
      );
    }

    const { data: row } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // insforge.database.from() returns an untyped row — cast is safe since we selected "*" against the known schema
    const profileRow = row as (ProfileRow & { resume_pdf_key: string | null }) | null;
    const profile = profileRow ? rowToProfile(profileRow) : EMPTY_PROFILE;

    const content = await generateResumeContent(profile);
    if (!content.success) {
      return NextResponse.json({ success: false, error: content.error }, { status: 502 });
    }

    // renderToBuffer's type expects ReactElement<DocumentProps> literally, but any component
    // returning a <Document> works at runtime — cast bridges the overly strict library typing.
    const buffer = await renderToBuffer(
      createElement(ResumePDF, {
        profile,
        email: user.email ?? "",
        content: content.data,
      }) as ReactElement<DocumentProps>,
    );

    const previousKey = profileRow?.resume_pdf_key;
    if (previousKey) {
      await insforge.storage.from("resumes").remove(previousKey);
    }

    const { data: uploaded, error: uploadError } = await insforge.storage
      .from("resumes")
      .upload(`${user.id}/resume.pdf`, new Blob([new Uint8Array(buffer)], { type: "application/pdf" }));

    if (uploadError || !uploaded) {
      console.error("[resume/generate]", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to save the generated resume." },
        { status: 500 },
      );
    }

    const { error: dbError } = await insforge.database
      .from("profiles")
      .upsert(
        { id: user.id, email: user.email, resume_pdf_url: uploaded.url, resume_pdf_key: uploaded.key },
        { onConflict: "id" },
      );

    if (dbError) {
      console.error("[resume/generate]", dbError);
      return NextResponse.json(
        { success: false, error: "Resume generated but failed to save to your profile." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, fileName: "resume.pdf" });
  } catch (error) {
    console.error("[resume/generate]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
