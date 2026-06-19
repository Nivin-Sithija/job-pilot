import { NextResponse } from "next/server";

import { createInsforgeServer } from "@/lib/insforge-server";
import { loadCurrentResumeBuffer } from "@/lib/resume";

export async function GET(): Promise<NextResponse> {
  const insforge = await createInsforgeServer();
  const { data: userData } = await insforge.auth.getCurrentUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to view your resume." },
      { status: 401 },
    );
  }

  const result = await loadCurrentResumeBuffer(insforge, user.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="resume.pdf"',
    },
  });
}
