"use server";

import { createAuthActions } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getPostHogClient } from "@/lib/posthog-server";

const CODE_VERIFIER_COOKIE = "insforge_code_verifier";

// Secure cookies are dropped by the browser on a plain-HTTP origin (no domain/TLS yet — see
// architecture.md's Hosting section), which silently breaks the PKCE round trip. Derive from
// the configured app URL so this self-corrects once a real https:// domain is in place.
const IS_HTTPS_APP_URL = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ?? false;

function getPostHogDistinctId(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  try {
    const raw = cookieStore.get(`ph_${process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN}_posthog`)?.value;
    if (raw) {
      const parsed = JSON.parse(raw) as { distinct_id?: string };
      return parsed.distinct_id ?? "anonymous";
    }
  } catch {
    // ignore parse errors
  }
  return "anonymous";
}

async function startOAuthSignIn(provider: "google" | "github") {
  const cookieStore = await cookies();
  const auth = createAuthActions({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    cookies: cookieStore,
  });

  const { data, error } = await auth.signInWithOAuth(provider, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    skipBrowserRedirect: true,
  });

  if (error || !data.url) {
    console.error("[actions/auth]", error);
    redirect("/login?error=oauth_start_failed");
  }

  const distinctId = getPostHogDistinctId(cookieStore);
  getPostHogClient().capture({
    distinctId,
    event: "sign_in_initiated",
    properties: { provider },
  });

  if (data.codeVerifier) {
    cookieStore.set(CODE_VERIFIER_COOKIE, data.codeVerifier, {
      httpOnly: true,
      secure: IS_HTTPS_APP_URL,
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });
  }

  redirect(data.url);
}

export async function signInWithGoogle() {
  await startOAuthSignIn("google");
}

export async function signInWithGithub() {
  await startOAuthSignIn("github");
}

export async function signOutAction() {
  const cookieStore = await cookies();

  const insforge = await createInsforgeServer();
  const { data: userData } = await insforge.auth.getCurrentUser();
  const distinctId = (userData.user as { id?: string; email?: string } | null)?.id
    ?? (userData.user as { id?: string; email?: string } | null)?.email
    ?? "anonymous";

  getPostHogClient().capture({
    distinctId,
    event: "signed_out",
  });

  const auth = createAuthActions({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    cookies: cookieStore,
  });

  await auth.signOut();
  redirect("/login");
}
