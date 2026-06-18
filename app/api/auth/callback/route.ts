import { createAuthActions } from "@insforge/sdk/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getPostHogClient } from "@/lib/posthog-server";

const CODE_VERIFIER_COOKIE = "insforge_code_verifier";

function getAnonymousDistinctId(request: NextRequest): string {
  try {
    const raw = request.cookies.get(
      `ph_${process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN}_posthog`,
    )?.value;
    if (raw) {
      const parsed = JSON.parse(raw) as { distinct_id?: string };
      return parsed.distinct_id ?? "anonymous";
    }
  } catch {
    // ignore parse errors
  }
  return "anonymous";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const codeVerifier = request.cookies.get(CODE_VERIFIER_COOKIE)?.value;

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url),
    );
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  try {
    const auth = createAuthActions({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
      requestCookies: request.cookies,
      responseCookies: response.cookies,
    });

    const { data, error } = await auth.exchangeOAuthCode(code, codeVerifier);

    if (error) {
      console.error("[api/auth/callback]", error);
      const distinctId = getAnonymousDistinctId(request);
      getPostHogClient().capture({
        distinctId,
        event: "sign_in_failed",
        properties: { reason: "exchange_failed" },
      });
      return NextResponse.redirect(
        new URL("/login?error=exchange_failed", request.url),
      );
    }

    const userId =
      (data as { user?: { id?: string } } | null)?.user?.id ??
      getAnonymousDistinctId(request);
    getPostHogClient().capture({
      distinctId: userId,
      event: "sign_in_succeeded",
    });

    response.cookies.delete(CODE_VERIFIER_COOKIE);
    return response;
  } catch (error) {
    console.error("[api/auth/callback]", error);
    const distinctId = getAnonymousDistinctId(request);
    getPostHogClient().capture({
      distinctId,
      event: "sign_in_failed",
      properties: { reason: "exception" },
    });
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", request.url),
    );
  }
}
