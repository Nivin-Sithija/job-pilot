import type { createInsforgeServer } from "@/lib/insforge-server";

export async function logAgentError(
  insforge: Awaited<ReturnType<typeof createInsforgeServer>>,
  runId: string,
  userId: string,
  jobId: string | null,
  error: unknown,
): Promise<void> {
  const { error: insertError } = await insforge.database.from("agent_logs").insert({
    run_id: runId,
    user_id: userId,
    job_id: jobId,
    message: error instanceof Error ? error.message : String(error),
    level: "error",
  });

  if (insertError) {
    console.error("[agent/logger]", insertError);
  }
}
