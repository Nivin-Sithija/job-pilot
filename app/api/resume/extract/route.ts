import { NextResponse } from "next/server";

import { createInsforgeServer } from "@/lib/insforge-server";
import { extractProfileFromResumeText, extractResumeText, type ExtractedProfileFields } from "@/lib/resume";

export async function POST(): Promise<NextResponse<{
  success: boolean;
  data?: ExtractedProfileFields;
  error?: string;
}>> {
  try {
    const insforge = await createInsforgeServer();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData.user;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in to extract from a resume." },
        { status: 401 },
      );
    }

    const { data: profileRow } = await insforge.database
      .from("profiles")
      .select("resume_pdf_key")
      .eq("id", user.id)
      .maybeSingle();

    // insforge.database.from() returns an untyped row — cast is safe since we selected exactly this column
    const resumeKey = (profileRow as { resume_pdf_key: string | null } | null)?.resume_pdf_key;
    if (!resumeKey) {
      return NextResponse.json(
        { success: false, error: "Please upload a resume first." },
        { status: 400 },
      );
    }

    const { data: blob, error: downloadError } = await insforge.storage
      .from("resumes")
      .download(resumeKey);

    if (downloadError || !blob) {
      console.error("[resume/extract]", downloadError);
      return NextResponse.json(
        { success: false, error: "Failed to load your uploaded resume." },
        { status: 500 },
      );
    }

    const buffer = Buffer.from(await blob.arrayBuffer());

    const textResult = await extractResumeText(buffer);
    if (!textResult.success) {
      return NextResponse.json({ success: false, error: textResult.error }, { status: 400 });
    }

    const extraction = await extractProfileFromResumeText(textResult.text);
    if (!extraction.success) {
      return NextResponse.json({ success: false, error: extraction.error }, { status: 502 });
    }

    return NextResponse.json({ success: true, data: extraction.data });
  } catch (error) {
    console.error("[resume/extract]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
